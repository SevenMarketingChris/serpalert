'use client'

import Link, { type LinkProps } from 'next/link'
import type { MouseEvent, ReactNode } from 'react'
import type { AnalyticsEventName } from '@/lib/analytics/contracts'
import { emitClientAnalyticsEvent } from '@/lib/analytics/client'

type AnalyticsPrimitive = string | number | boolean | null

type TrackedLinkProps = Omit<LinkProps, 'onClick'> & {
  children: ReactNode
  className?: string
  eventName?: AnalyticsEventName
  eventProperties?: Record<string, AnalyticsPrimitive>
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}

function hrefAsString(href: LinkProps['href']): string {
  if (typeof href === 'string') return href
  const params = new URLSearchParams()
  if (href.query) {
    for (const [key, value] of Object.entries(href.query)) {
      if (value == null) continue
      if (Array.isArray(value)) {
        for (const item of value) {
          params.append(key, String(item))
        }
      } else {
        params.append(key, String(value))
      }
    }
  }
  const query = params.toString() ? `?${params.toString()}` : ''
  const hash = href.hash ?? ''
  return `${href.pathname}${query}${hash ? `#${hash}` : ''}`
}

export function TrackedLink({
  children,
  eventName = 'cta_clicked',
  eventProperties,
  onClick,
  href,
  ...linkProps
}: TrackedLinkProps) {
  return (
    <Link
      {...linkProps}
      href={href}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return

        void emitClientAnalyticsEvent({
          name: eventName,
          properties: {
            ...eventProperties,
            targetHref: hrefAsString(href),
          },
        })
      }}
    >
      {children}
    </Link>
  )
}
