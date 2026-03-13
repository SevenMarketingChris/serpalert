import { NextResponse } from 'next/server'
import { isCronRequest } from '@/lib/auth'
import { getAllActiveBrands, insertAuctionInsights } from '@/lib/db/queries'
import { getAuctionInsights } from '@/lib/google-ads'

export const maxDuration = 60

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allBrands = await getAllActiveBrands()
  const today = new Date().toISOString().split('T')[0]
  const results = []

  for (const brand of allBrands) {
    if (!brand.googleAdsCustomerId) {
      results.push({ brand: brand.name, status: 'skipped' })
      continue
    }
    try {
      const insights = await getAuctionInsights(brand.googleAdsCustomerId)
      await insertAuctionInsights(insights.map(i => ({
        brandId: brand.id, date: today, competitorDomain: i.competitorDomain,
        impressionShare: i.impressionShare?.toString(),
        overlapRate: i.overlapRate?.toString(),
        outrankingShare: i.outrankingShare?.toString(),
      })))
      results.push({ brand: brand.name, status: 'ok', count: insights.length })
    } catch (err) {
      results.push({ brand: brand.name, status: 'error', error: String(err) })
    }
  }

  return NextResponse.json({ results, date: today })
}
