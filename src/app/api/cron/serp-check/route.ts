import { NextResponse } from 'next/server'
import { isCronRequest } from '@/lib/auth'
import { getAllActiveBrands, insertSerpCheck, insertCompetitorAds, getCompetitorDomainsLastNDays } from '@/lib/db/queries'
import { checkSerpForBrand } from '@/lib/dataforseo'
import { screenshotSerp } from '@/lib/puppeteer'
import { uploadScreenshot } from '@/lib/supabase-storage'
import { sendNewCompetitorAlert } from '@/lib/slack'
import { acquireLock, releaseLock } from '@/lib/cron-lock'

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
        const { ads, taskId } = await checkSerpForBrand(keyword, 'United Kingdom', {
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

        const check = await insertSerpCheck({ brandId: brand.id, keyword, competitorCount: ads.length, screenshotUrl })

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

        return { brand: brand.name, keyword, competitorCount: ads.length, status: 'ok' }
      } catch (err) {
        console.error(`SERP check failed: ${brand.name}/${keyword}`, err)
        return { brand: brand.name, keyword, status: 'error', error: String(err) }
      }
    }

    // Process in parallel with concurrency limit
    const CONCURRENCY = 1 // Keep at 1: 768MB RAM with Chromium is tight
    const results = []
    for (let i = 0; i < jobs.length; i += CONCURRENCY) {
      const batch = jobs.slice(i, i + CONCURRENCY)
      const batchResults = await Promise.all(batch.map(processJob))
      results.push(...batchResults)
    }

    return NextResponse.json({ results, timestamp: new Date().toISOString() })
  } finally {
    await releaseLock('serp-check')
  }
}
