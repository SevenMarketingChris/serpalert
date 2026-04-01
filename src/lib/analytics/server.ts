import { db } from '@/lib/db'
import { analyticsEvents } from '@/lib/db/schema'
import type { AnalyticsEventPayload } from '@/lib/analytics/contracts'
import type { AttributionContext } from '@/lib/attribution'

export async function emitServerAnalyticsEvent(
  payload: AnalyticsEventPayload,
  attribution: AttributionContext,
): Promise<void> {
  const firstTouch = attribution.firstTouch
  const lastTouch = attribution.lastTouch

  try {
    await db.insert(analyticsEvents).values({
      eventName: payload.name,
      anonymousId: attribution.anonymousId,
      sessionId: attribution.sessionId,
      userId: payload.userId,
      brandId: payload.brandId,
      leadId: payload.leadId,
      path: payload.path,
      url: payload.url,
      properties: payload.properties ?? {},
      firstTouchSource: firstTouch?.source,
      firstTouchMedium: firstTouch?.medium,
      firstTouchCampaign: firstTouch?.campaign,
      firstTouchReferrer: firstTouch?.referrer,
      lastTouchSource: lastTouch?.source,
      lastTouchMedium: lastTouch?.medium,
      lastTouchCampaign: lastTouch?.campaign,
      lastTouchReferrer: lastTouch?.referrer,
      happenedAt: payload.happenedAt ? new Date(payload.happenedAt) : new Date(),
    })
  } catch (error) {
    console.error('Failed to persist analytics event:', error)
  }
}
