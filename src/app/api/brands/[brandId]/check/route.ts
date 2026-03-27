import { NextResponse } from 'next/server'
import { getBrandById, insertSerpCheck, insertCompetitorAds, getCompetitorDomainsLastNDays, hasScreenshotToday } from '@/lib/db/queries'
import { checkSerpForBrand } from '@/lib/dataforseo'
import { screenshotSerp } from '@/lib/puppeteer'
import { uploadScreenshot } from '@/lib/supabase-storage'
import { sendNewCompetitorAlert } from '@/lib/slack'

export const maxDuration = 120

export async function POST(request: Request, { params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params
  const brand = await getBrandById(brandId)
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
  }

  const recentDomains = await getCompetitorDomainsLastNDays(brand.id, 7)
  const results = []

  for (const keyword of brand.keywords) {
    try {
      const ads = await checkSerpForBrand(keyword, 'United Kingdom', {
        brandDomain: brand.domain ?? undefined,
      })

      let screenshotUrl: string | undefined
      if (ads.length > 0 && !(await hasScreenshotToday(brand.id, keyword))) {
        try {
          const buffer = await screenshotSerp(keyword)
          screenshotUrl = await uploadScreenshot(
            buffer,
            `${brand.id}/${new Date().toISOString().split('T')[0]}-${encodeURIComponent(keyword)}.png`
          )
        } catch (ssErr) {
          console.error(`Screenshot failed for "${keyword}":`, ssErr)
        }
      }

      const check = await insertSerpCheck({
        brandId: brand.id, keyword, competitorCount: ads.length, screenshotUrl,
      })

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
              await sendNewCompetitorAlert({
                webhookUrl: brand.slackWebhookUrl, brandName: brand.name,
                domain: ad.domain, keyword,
              })
            } catch {}
          }
        }
      }

      results.push({ keyword, competitorCount: ads.length, status: 'ok' })
    } catch (err) {
      console.error(`Manual check failed: ${brand.name}/${keyword}`, err)
      results.push({ keyword, status: 'error', error: String(err) })
    }
  }

  return NextResponse.json({ results, timestamp: new Date().toISOString() })
}
