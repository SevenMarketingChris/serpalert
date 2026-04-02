import { NextResponse } from 'next/server'
import { analyticsEventPayloadSchema } from '@/lib/analytics/contracts'
import { readAttributionContextFromRequest } from '@/lib/attribution'
import { emitServerAnalyticsEvent } from '@/lib/analytics/server'
import { rateLimit } from '@/lib/rate-limit'

// Public endpoint — rate limited per IP to prevent abuse
export async function POST(request: Request) {
  const ip = request.headers.get('x-real-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown'
  const { ok } = await rateLimit(`analytics-event-${ip}`, { limit: 100, windowMs: 60_000 })
  if (!ok) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = analyticsEventPayloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid analytics payload' }, { status: 400 })
  }

  const attribution = readAttributionContextFromRequest(request)
  await emitServerAnalyticsEvent(parsed.data, attribution)
  return NextResponse.json({ ok: true })
}
