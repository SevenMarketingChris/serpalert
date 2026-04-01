import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { checkSerpForAds } from '@/lib/serpapi'
import { readAttributionContextFromRequest } from '@/lib/attribution'
import { emitServerAnalyticsEvent } from '@/lib/analytics/server'

export async function POST(request: Request) {
  const attribution = readAttributionContextFromRequest(request)
  const requestUrl = new URL(request.url)

  // Rate limit by IP: 1 per hour
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown'
  const { ok } = rateLimit(`audit:${ip}`, { limit: 1, windowMs: 3_600_000 })

  if (!ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. One free audit per hour.' },
      { status: 429 }
    )
  }

  let keyword: string
  try {
    const body = await request.json()
    keyword = typeof body.keyword === 'string' ? body.keyword.trim() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!keyword || keyword.length > 200) {
    return NextResponse.json({ error: 'Invalid keyword' }, { status: 400 })
  }

  try {
    const results = await checkSerpForAds(keyword)

    const competitors = results.map((r) => ({
      domain: r.domain,
      headline: r.headline,
      description: r.description,
      position: r.position,
    }))

    await emitServerAnalyticsEvent({
      name: 'audit_check_requested',
      path: requestUrl.pathname,
      url: request.url,
      properties: {
        keywordLength: keyword.length,
        competitorCount: competitors.length,
      },
    }, attribution)

    return NextResponse.json({
      competitorCount: competitors.length,
      competitors,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('Audit SERP check failed:', err)
    return NextResponse.json(
      { error: 'Failed to check Google. Please try again.' },
      { status: 500 }
    )
  }
}
