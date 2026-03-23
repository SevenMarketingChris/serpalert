'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface DashboardTabsProps {
  brandId: string
  hasGoogleAds: boolean
}

export function DashboardTabs({ brandId, hasGoogleAds }: DashboardTabsProps) {
  const pathname = usePathname()

  const tabs = [
    { label: 'Activity', href: `/dashboard/${brandId}`, exact: true },
    { label: 'Competitors', href: `/dashboard/${brandId}/competitors`, exact: false },
    ...(hasGoogleAds
      ? [{ label: 'Insights', href: `/dashboard/${brandId}/insights`, exact: false }]
      : []),
  ]

  return (
    <nav
      className="flex flex-row"
      style={{ borderBottom: '1px solid oklch(22% 0.03 250)' }}
    >
      {tabs.map(tab => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="text-[11px] uppercase tracking-[1px] font-mono transition-colors"
            style={{
              padding: '8px 16px',
              borderBottom: isActive ? '2px solid oklch(62% 0.22 250)' : '2px solid transparent',
              color: isActive ? 'oklch(94% 0.005 250)' : 'oklch(60% 0.02 250)',
            }}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
