import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBrandById, getCompetitorDomainsLastNDays } from '@/lib/db/queries'
import { processKeywordCheck } from '@/lib/process-keyword-check'
import { rateLimit } from '@/lib/rate-limit'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
  const { checkIsAdmin } = await import('@/lib/auth')
  const isAdmin = await checkIsAdmin()

  const { ok } = rateLimit(`manual-check:${brandId}`, { limit: 3, windowMs: 300_000 })
  if (!ok) {
    return NextResponse.json({ error: 'Too many requests. Try again in a few minutes.' }, { status: 429 })
  }

  const brand = await getBrandById(brandId)
  if (!brand) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (brand.agencyManaged && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!brand.agencyManaged && brand.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
