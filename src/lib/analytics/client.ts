'use client'

import type { AnalyticsEventName } from '@/lib/analytics/contracts'

export async function emitClientAnalyticsEvent(input: {
  name: AnalyticsEventName
  path?: string
  url?: string
  brandId?: string
  leadId?: string
  properties?: Record<string, string | number | boolean | null>
}): Promise<void> {
  try {
    const path = input.path ?? window.location.pathname
    const url = input.url ?? window.location.href

    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        name: input.name,
        path,
        url,
        brandId: input.brandId,
        leadId: input.leadId,
        properties: input.properties,
      }),
    })
  } catch {
    // Analytics should never break product flow.
  }
}
