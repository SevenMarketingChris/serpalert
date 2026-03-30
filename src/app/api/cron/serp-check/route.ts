import { NextResponse } from 'next/server'
import { isCronRequest } from '@/lib/auth'
import { getAllActiveBrands, insertSerpCheck, insertCompetitorAds, getCompetitorDomainsLastNDays } from '@/lib/db/queries'
import { checkSerpForBrand } from '@/lib/dataforseo'
import { screenshotSerp } from '@/lib/puppeteer'
import { uploadScreenshot } from '@/lib/blob-storage'
import { sendNewCompetitorAlert } from '@/lib/slack'
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

    // Build all jobs upfront, fetching recent domains once per brand
    const jobs: Array<{ brand: typeof allBrands[0]; keyword: string; recentDomains: string[] }> = []
    for (const brand of allBrands) {
      const recentDomains = await getCompetitorDomainsLastNDays(brand.id, 7)
      for (const keyword of brand.keywords) {
        jobs.push({ brand, keyword, recentDomains })
      }
    }

    async function processJob(job: { brand: typeof allBrands[0]; keyword: string; recentDomains: string[] }) {
      const { brand, keyword, recentDomains } = job
      try {
        const { ads, taskId, adCheckDegraded } = await checkSerpForBrand(keyword, 'United Kingdom', {
          brandDomain: brand.domain ?? undefined,
        })
        let screenshotUrl: string | undefined

        // Take a screenshot on every check
        if (taskId) {
          try {
            const buffer = await screenshotSerp(taskId)
            screenshotUrl = await uploadScreenshot(
              buffer,
              `${brand.id}/${new Date().toISOString().replace(/[:.]/g, '-')}-${encodeURIComponent(keyword)}.png`
            )
          } catch (ssErr) {
            console.error(`Screenshot failed for "${keyword}":`, ssErr)
          }
        } else {
          console.warn(`No taskId for "${keyword}" — screenshot skipped`)
        }

        const uniqueCompetitors = new Set(ads.map(a => a.domain)).size
        const check = await insertSerpCheck({ brandId: brand.id, keyword, competitorCount: uniqueCompetitors, screenshotUrl })

        if (ads.length > 0) {
          const now = new Date()
          await insertCompetitorAds(ads.map(ad => ({
            serpCheckId: check.id, brandId: brand.id, domain: ad.domain,
            headline: ad.headline ?? undefined, description: ad.description ?? undefined,
            displayUrl: ad.displayUrl ?? undefined, destinationUrl: ad.destinationUrl ?? undefined,
            position: ad.position, firstSeenAt: now,
          })))
          for (const ad of ads) {
            if (!recentDomains.includes(ad.domain)) {
              try {
                await sendNewCompetitorAlert({ webhookUrl: brand.slackWebhookUrl, brandName: brand.name, domain: ad.domain, keyword })
              } catch (alertErr) {
                console.error(`Slack alert failed for ${ad.domain}:`, alertErr)
              }
            }
          }
        }

        return { brandId: brand.id, brand: brand.name, keyword, competitorCount: uniqueCompetitors, status: 'ok' as const, adCheckDegraded }
      } catch (err) {
        console.error(`SERP check failed: ${brand.name}/${keyword}`, err)
        return { brandId: brand.id, brand: brand.name, keyword, status: 'error' as const, error: 'Check failed', competitorCount: 0, adCheckDegraded: false }
      }
    }

    // Process in parallel with concurrency limit
    const CONCURRENCY = 3 // No Chromium — all HTTP API calls, safe to parallelize
    const results = []
    for (let i = 0; i < jobs.length; i += CONCURRENCY) {
      const batch = jobs.slice(i, i + CONCURRENCY)
      const batchResults = await Promise.all(batch.map(processJob))
      results.push(...batchResults)
    }

    // Auto-toggle brand campaigns based on competitor detection
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
