import { NextResponse } from 'next/server'
import { isCronRequest } from '@/lib/auth'
import { getAllActiveBrands, getRecentSerpChecks, getCompetitorAdsForChecks } from '@/lib/db/queries'
import { sendDailySummary } from '@/lib/slack'
import { toUTCDate } from '@/lib/time'

export const maxDuration = 120

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const brands = await getAllActiveBrands()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = toUTCDate(yesterday)
  const results = []

  for (const brand of brands) {
    // Skip brands without Slack webhook
    if (!brand.slackWebhookUrl) {
      results.push({ brand: brand.name, status: 'skipped', reason: 'no webhook' })
      continue
    }

    try {
      const checks = await getRecentSerpChecks(brand.id, 200)
      const yesterdayChecks = checks.filter(c => toUTCDate(new Date(c.checkedAt)) === yesterdayStr)

      if (yesterdayChecks.length === 0) {
        results.push({ brand: brand.name, status: 'skipped', reason: 'no checks yesterday' })
        continue
      }

      const ads = await getCompetitorAdsForChecks(yesterdayChecks.map(c => c.id))
      const screenshotCount = yesterdayChecks.filter(c => c.screenshotUrl).length

      const competitorsFound = ads.map(ad => {
        const check = yesterdayChecks.find(c => c.id === ad.serpCheckId)
        return {
          domain: ad.domain,
          keyword: check?.keyword || 'unknown',
          position: ad.position,
        }
      })

      const uniqueDomains = new Set(competitorsFound.map(c => c.domain))

      await sendDailySummary({
        webhookUrl: brand.slackWebhookUrl,
        brandName: brand.name,
        brandId: brand.id,
        checksYesterday: yesterdayChecks.length,
        competitorsFound,
        screenshotCount,
        isProtected: uniqueDomains.size === 0,
      })

      results.push({ brand: brand.name, status: 'sent', competitors: uniqueDomains.size })
    } catch (err) {
      console.error(`Daily summary failed for ${brand.name}:`, err instanceof Error ? err.message : err)
      results.push({ brand: brand.name, status: 'error' })
    }
  }

  return NextResponse.json({ results })
}
