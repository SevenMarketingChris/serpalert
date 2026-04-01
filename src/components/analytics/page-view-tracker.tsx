'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { emitClientAnalyticsEvent } from '@/lib/analytics/client'

type AnalyticsPrimitive = string | number | boolean | null

export function PageViewTracker({
  properties,
}: {
  properties?: Record<string, AnalyticsPrimitive>
}) {
  const pathname = usePathname()
  const propertiesToken = JSON.stringify(properties ?? {})

  useEffect(() => {
    void emitClientAnalyticsEvent({
      name: 'page_view',
      path: pathname,
      properties,
    })
  }, [pathname, propertiesToken])

  return null
}
