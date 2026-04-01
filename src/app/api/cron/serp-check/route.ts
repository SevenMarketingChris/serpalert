import { NextResponse } from 'next/server'
import { isCronRequest } from '@/lib/auth'
import { getAllActiveBrands, getCompetitorDomainsLastNDays } from '@/lib/db/queries'
import { processKeywordCheck } from '@/lib/process-keyword-check'
import { acquireLock, releaseLock } from '@/lib/cron-lock'
import { setCampaignStatus } from '@/lib/google-ads'

export const maxDuration = 300

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await acquireLock('serp-check'))) {
    return NextResponse.json({ error: 'Already running' }, { status: 409 })
  }

  try {
    const allBrands = await getAllActiveBrands()

    const jobs: Array<{ brand: typeof allBrands[0]; keyword: string; recentDomains: string[] }> = []
    for (const brand of allBrands) {
      const recentDomains = await getCompetitorDomainsLastNDays(brand.id, 7)
      for (const keyword of brand.keywords) {
        jobs.push({ brand, keyword, recentDomains })
      }
    }

    const CONCURRENCY = 3
    const results = []
    for (let i = 0; i < jobs.length; i += CONCURRENCY) {
      const batch = jobs.slice(i, i + CONCURRENCY)
      const batchResults = await Promise.all(batch.map(job =>
        processKeywordCheck({
          brandId: job.brand.id,
          brandName: job.brand.name,
          keyword: job.keyword,
          brandDomain: job.brand.domain,
          slackWebhookUrl: job.brand.slackWebhookUrl,
          recentDomains: job.recentDomains,
        }).then(r => ({ ...r, brandId: job.brand.id, brand: job.brand.name }))
      ))
      results.push(...batchResults)
    }

    for (const brand of allBrands) {
      if (!brand.googleAdsCustomerId || !brand.brandCampaignId) continue

      const brandResults = results.filter(r => r.brandId === brand.id)
      const anyError = brandResults.some(r => r.status === 'error')
      const anyDegraded = brandResults.some(r => r.adCheckDegraded)
      if (anyError || anyDegraded) {
        console.warn(`Skipping campaign toggle for ${brand.name} — checks were degraded or errored`)
        continue
      }
      const hasCompetitors = brandResults.some(r => r.competitorCount && r.competitorCount > 0)

      try {
        if (hasCompetitors) {
          console.info(`Auto-enabling brand campaign for ${brand.name} — competitors detected`)
          await setCampaignStatus(brand.googleAdsCustomerId, brand.brandCampaignId, true)
        } else {
          console.info(`Auto-pausing brand campaign for ${brand.name} — no competitors`)
          await setCampaignStatus(brand.googleAdsCustomerId, brand.brandCampaignId, false)
        }
      } catch (err) {
        console.error(`Campaign toggle failed for ${brand.name}:`, err)
      }
    }

    return NextResponse.json({ results, timestamp: new Date().toISOString() })
  } finally {
    await releaseLock('serp-check')
  }
}
