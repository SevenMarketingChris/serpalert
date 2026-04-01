import { NextResponse } from 'next/server'
import { analyticsEventPayloadSchema } from '@/lib/analytics/contracts'
import { readAttributionContextFromRequest } from '@/lib/attribution'
import { emitServerAnalyticsEvent } from '@/lib/analytics/server'

export async function POST(request: Request) {
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
