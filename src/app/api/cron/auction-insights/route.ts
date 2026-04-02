import { NextResponse } from 'next/server'
import { isCronRequest } from '@/lib/auth'
import { isUKHour } from '@/lib/timezone'
import { getAllActiveBrands, insertAuctionInsights } from '@/lib/db/queries'
import { getAuctionInsights } from '@/lib/google-ads'
import { acquireLock, releaseLock } from '@/lib/cron-lock'

export const maxDuration = 60

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isUKHour(6)) {
    return NextResponse.json({ skipped: true, reason: 'Not 6am UK time' })
  }

  if (!(await acquireLock('auction-insights'))) {
    return NextResponse.json({ error: 'Already running' }, { status: 409 })
  }

  try {
    const allBrands = await getAllActiveBrands()
    const today = new Date().toISOString().split('T')[0]
    const results: { brand: string; status: string; count?: number; error?: string }[] = []

    const CONCURRENCY = 3
    for (let i = 0; i < allBrands.length; i += CONCURRENCY) {
      const batch = allBrands.slice(i, i + CONCURRENCY)
      await Promise.all(batch.map(async (brand) => {
        if (!brand.googleAdsCustomerId) {
          results.push({ brand: brand.name, status: 'skipped' })
          return
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
          results.push({ brand: brand.name, status: 'error', error: 'Check failed' })
        }
      }))
    }

    return NextResponse.json({ results, date: today })
  } finally {
    await releaseLock('auction-insights')
  }
}
