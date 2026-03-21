import { NextResponse } from 'next/server'
import { isCronRequest } from '@/lib/auth'
import { getAllActiveBrands, insertAuctionInsights } from '@/lib/db/queries'
import { getAuctionInsights } from '@/lib/google-ads'
import { acquireLock, releaseLock } from '@/lib/cron-lock'

export const maxDuration = 60

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await acquireLock('auction-insights'))) {
    return NextResponse.json({ error: 'Already running' }, { status: 409 })
  }

  try {
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
        console.error(`Auction insights failed for ${brand.name}:`, err)
        results.push({ brand: brand.name, status: 'error', error: String(err) })
      }
    }

    return NextResponse.json({ results, date: today })
  } finally {
    await releaseLock('auction-insights')
  }
}
