import { NextResponse } from 'next/server'
import { isCronRequest } from '@/lib/auth'
import { getAllActiveBrands, insertSerpCheck, insertCompetitorAds, getCompetitorDomainsLastNDays, getLastHeadlineForDomain } from '@/lib/db/queries'
import { checkSerpForBrand } from '@/lib/dataforseo'
import { screenshotLandingPage } from '@/lib/puppeteer'
import { uploadScreenshot } from '@/lib/supabase-storage'
import { sendNewCompetitorAlert, sendCopyChangeAlert } from '@/lib/slack'

export const maxDuration = 300

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allBrands = await getAllActiveBrands()
  const results = []

  for (const brand of allBrands) {
    const scanGroupId = crypto.randomUUID()
    for (const keyword of brand.keywords) {
      try {
        const ads = await checkSerpForBrand(keyword, 'United Kingdom')
        const check = await insertSerpCheck({ brandId: brand.id, keyword, competitorCount: ads.length, scanGroupId })

        if (ads.length > 0) {
          const now = new Date()
          const recentDomains = await getCompetitorDomainsLastNDays(brand.id, 7)

          // Capture landing page screenshots for new competitors + detect copy changes
          const adsWithScreenshots = await Promise.all(ads.map(async ad => {
            let landingPageScreenshotUrl: string | undefined
            const isNew = !recentDomains.includes(ad.domain)

            if (isNew && ad.destinationUrl) {
              try {
                const buffer = await screenshotLandingPage(ad.destinationUrl)
                landingPageScreenshotUrl = await uploadScreenshot(
                  buffer,
                  `landing-pages/${brand.id}/${ad.domain}/${Date.now()}.png`
                )
              } catch (lpErr) {
                console.error(`Landing page screenshot failed for ${ad.domain}:`, lpErr)
              }
            }

            // Detect copy changes for existing competitors
            if (!isNew && ad.headline) {
              try {
                const lastHeadline = await getLastHeadlineForDomain(brand.id, ad.domain)
                if (lastHeadline && lastHeadline !== ad.headline) {
                  await sendCopyChangeAlert({
                    webhookUrl: brand.slackWebhookUrl,
                    brandName: brand.name,
                    domain: ad.domain,
                    keyword,
                    oldHeadline: lastHeadline,
                    newHeadline: ad.headline,
                  })
                }
              } catch (copyErr) {
                console.error(`Copy change check failed for ${ad.domain}:`, copyErr)
              }
            }

            return { ...ad, landingPageScreenshotUrl }
          }))

          await insertCompetitorAds(adsWithScreenshots.map(ad => ({
            serpCheckId: check.id, brandId: brand.id, domain: ad.domain,
            headline: ad.headline ?? undefined, description: ad.description ?? undefined,
            displayUrl: ad.displayUrl ?? undefined, destinationUrl: ad.destinationUrl ?? undefined,
            position: ad.position, landingPageScreenshotUrl: ad.landingPageScreenshotUrl,
            firstSeenAt: now,
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

        results.push({ brand: brand.name, keyword, competitorCount: ads.length, status: 'ok' })
      } catch (err) {
        console.error(`SERP check failed: ${brand.name}/${keyword}`, err)
        results.push({ brand: brand.name, keyword, status: 'error', error: String(err) })
      }
    }
  }

  return NextResponse.json({ results, timestamp: new Date().toISOString() })
}
