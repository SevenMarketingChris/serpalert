import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { auth } from '../../../../auth'
import { getBrandById, insertSerpCheck, insertCompetitorAds, getCompetitorDomainsLastNDays } from '@/lib/db/queries'
import { checkSerpForBrand } from '@/lib/dataforseo'
import { screenshotSerp } from '@/lib/puppeteer'
import { uploadScreenshot } from '@/lib/supabase-storage'
import { sendNewCompetitorAlert } from '@/lib/slack'

export const maxDuration = 300

async function isAuthorised(request: Request) {
  if (isAdminRequest(request)) return true
  const session = await auth()
  return !!session?.user
}

export async function POST(request: Request) {
  if (!await isAuthorised(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { brandId } = await request.json()
  const brand = await getBrandById(brandId)
  if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 })

  const scanGroupId = crypto.randomUUID()
  const results = []
  for (const keyword of brand.keywords) {
    try {
      const ads = await checkSerpForBrand(keyword, 'United Kingdom')
      let screenshotUrl: string | undefined

      // Take screenshot for every check
      try {
        const buffer = await screenshotSerp(keyword)
        screenshotUrl = await uploadScreenshot(
          buffer,
          `${brand.id}/${Date.now()}-${encodeURIComponent(keyword)}.png`
        )
      } catch (screenshotErr) {
        console.error('Screenshot failed:', screenshotErr)
      }

      const check = await insertSerpCheck({ brandId: brand.id, keyword, competitorCount: ads.length, screenshotUrl, scanGroupId })

      if (ads.length > 0) {
        const now = new Date()
        const recentDomains = await getCompetitorDomainsLastNDays(brand.id, 7)
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
              console.error('Slack alert failed:', alertErr)
            }
          }
        }
      }

      results.push({ keyword, competitorCount: ads.length, status: 'ok' })
    } catch (err) {
      console.error(`Check failed: ${keyword}`, err)
      results.push({ keyword, status: 'error', error: String(err) })
    }
  }

  return NextResponse.json({ ok: true, results })
}
