import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBrandById, getCompetitorDomainsLastNDays, getLastCheckForBrand } from '@/lib/db/queries'
import { processKeywordCheck } from '@/lib/process-keyword-check'
import { rateLimit } from '@/lib/rate-limit'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MANUAL_CHECK_COOLDOWN_MS = 4 * 60 * 60 * 1000 // 4 hours

export const maxDuration = 300

export async function POST(request: Request, { params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params

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
  const results = []

  for (const keyword of brand.keywords) {
    const result = await processKeywordCheck({
      brandId: brand.id,
      brandName: brand.name,
      keyword,
      brandDomain: brand.domain,
      slackWebhookUrl: brand.slackWebhookUrl,
      recentDomains,
    })
    results.push(result)
  }

  return NextResponse.json({ results, timestamp: new Date().toISOString() })
}
