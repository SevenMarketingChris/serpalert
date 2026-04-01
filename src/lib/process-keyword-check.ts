import { insertSerpCheck, insertCompetitorAds } from '@/lib/db/queries'
import { checkSerpForBrand } from '@/lib/dataforseo'
import { screenshotSerp } from '@/lib/screenshot'
import { uploadScreenshot } from '@/lib/blob-storage'
import { sendNewCompetitorAlert } from '@/lib/slack'

export interface CheckResult {
  keyword: string
  competitorCount: number
  status: 'ok' | 'error'
  adCheckDegraded: boolean
  error?: string
}

export async function processKeywordCheck(opts: {
  brandId: string
  brandName: string
  keyword: string
  brandDomain: string | null
  slackWebhookUrl: string | null
  recentDomains: string[]
}): Promise<CheckResult> {
  const { brandId, brandName, keyword, brandDomain, slackWebhookUrl, recentDomains } = opts

  try {
    const { ads, taskId, adCheckDegraded } = await checkSerpForBrand(keyword, 'United Kingdom', {
      brandDomain: brandDomain ?? undefined,
    })

    let screenshotUrl: string | undefined
    if (taskId) {
      try {
        const buffer = await screenshotSerp(taskId)
        screenshotUrl = await uploadScreenshot(
          buffer,
          `${brandId}/${new Date().toISOString().replace(/[:.]/g, '-')}-${encodeURIComponent(keyword)}.png`
        )
      } catch (ssErr) {
        console.error(`Screenshot failed for "${keyword}":`, ssErr)
      }
    } else {
      console.warn(`No taskId for "${keyword}" — screenshot skipped`)
    }

    const uniqueCompetitors = new Set(ads.map(a => a.domain)).size
    const check = await insertSerpCheck({
      brandId, keyword, competitorCount: uniqueCompetitors, screenshotUrl,
    })

    if (ads.length > 0) {
      const now = new Date()
      await insertCompetitorAds(ads.map(ad => ({
        serpCheckId: check.id, brandId, domain: ad.domain,
        headline: ad.headline ?? undefined, description: ad.description ?? undefined,
        displayUrl: ad.displayUrl ?? undefined, destinationUrl: ad.destinationUrl ?? undefined,
        position: ad.position, firstSeenAt: now,
      })))

      for (const ad of ads) {
        if (!recentDomains.includes(ad.domain)) {
          try {
            await sendNewCompetitorAlert({
              webhookUrl: slackWebhookUrl, brandName,
              brandId, domain: ad.domain, keyword,
            })
          } catch (alertErr) {
            console.error(`Slack alert failed for ${ad.domain}:`, alertErr)
          }
        }
      }
    }

    return { keyword, competitorCount: uniqueCompetitors, status: 'ok', adCheckDegraded }
  } catch (err) {
    console.error(`SERP check failed: ${brandName}/${keyword}`, err)
    return { keyword, competitorCount: 0, status: 'error', adCheckDegraded: false, error: 'Check failed' }
  }
}
