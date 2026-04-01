import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBrandById, insertSerpCheck, insertCompetitorAds, getCompetitorDomainsLastNDays, getLastCheckForBrand, getSerpCheckCountForBrand } from '@/lib/db/queries'
import { checkSerpForBrand } from '@/lib/dataforseo'
import { screenshotSerp } from '@/lib/screenshot'
import { uploadScreenshot } from '@/lib/blob-storage'
import { sendNewCompetitorAlert } from '@/lib/slack'
import { readAttributionContextFromRequest } from '@/lib/attribution'
import { emitServerAnalyticsEvent } from '@/lib/analytics/server'
const MANUAL_CHECK_COOLDOWN_MS = 4 * 60 * 60 * 1000 // 4 hours

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const maxDuration = 300

export async function POST(request: Request, { params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params
  const attribution = readAttributionContextFromRequest(request)
  const requestUrl = new URL(request.url)

  if (!UUID_RE.test(brandId)) {
    return NextResponse.json({ error: 'Invalid brand ID' }, { status: 400 })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { checkIsAdmin, authorizeBrandAccess } = await import('@/lib/auth')
  const isAdmin = await checkIsAdmin()

  const brand = await getBrandById(brandId)
  if (!brand) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  try {
    authorizeBrandAccess(brand, userId, isAdmin)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // DB-backed cooldown: 1 manual check per 4 hours per brand
  const lastCheck = await getLastCheckForBrand(brandId)
  if (lastCheck) {
    const elapsed = Date.now() - new Date(lastCheck.checkedAt).getTime()
    if (elapsed < MANUAL_CHECK_COOLDOWN_MS) {
      const remainingMs = MANUAL_CHECK_COOLDOWN_MS - elapsed
      const remainingMins = Math.ceil(remainingMs / 60_000)
      const hours = Math.floor(remainingMins / 60)
      const mins = remainingMins % 60
      const waitText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
      return NextResponse.json({
        error: `Manual checks are limited to once every 4 hours. Next check available in ${waitText}.`,
        nextCheckAt: new Date(Date.now() + remainingMs).toISOString(),
        cooldownMs: remainingMs,
      }, { status: 429 })
    }
  }

  const recentDomains = await getCompetitorDomainsLastNDays(brand.id, 7)
  const existingCheckCount = await getSerpCheckCountForBrand(brand.id)
  let firstMonitoringResultRecorded = existingCheckCount > 0
  const results = []

  for (const keyword of brand.keywords) {
    try {
      const { ads, taskId, adCheckDegraded } = await checkSerpForBrand(keyword, 'United Kingdom', {
        brandDomain: brand.domain ?? undefined,
      })

      let screenshotUrl: string | undefined
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

      const check = await insertSerpCheck({
        brandId: brand.id, keyword, competitorCount: new Set(ads.map(a => a.domain)).size, screenshotUrl,
      })

      if (!firstMonitoringResultRecorded) {
        firstMonitoringResultRecorded = true
        await emitServerAnalyticsEvent({
          name: 'first_monitoring_result',
          path: requestUrl.pathname,
          url: request.url,
          userId,
          brandId: brand.id,
          properties: {
            keyword,
            competitorCount: new Set(ads.map(a => a.domain)).size,
            trigger: 'manual',
          },
        }, attribution)
      }

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
                brandId: brand.id, domain: ad.domain, keyword,
              })
            } catch (err) { console.error('[brands/check] Failed to send Slack alert:', err) }
          }
        }
      }

      results.push({ keyword, competitorCount: new Set(ads.map(a => a.domain)).size, status: 'ok', adCheckDegraded })
    } catch (err) {
      console.error(`Manual check failed: ${brand.name}/${keyword}`, err)
      results.push({ keyword, status: 'error', error: 'Check failed' })
    }
  }

  return NextResponse.json({ results, timestamp: new Date().toISOString() })
}
