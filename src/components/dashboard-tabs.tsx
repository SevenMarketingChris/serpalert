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
    { label: 'Screenshots', href: `/dashboard/${brandId}/screenshots`, exact: false },
    ...(hasGoogleAds
      ? [{ label: 'Insights', href: `/dashboard/${brandId}/insights`, exact: false }]
      : []),
    { label: 'Settings', href: `/dashboard/${brandId}/settings`, exact: false },
  ]

  return (
    <nav className="flex flex-row border-b border-border overflow-x-auto">
      {tabs.map(tab => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`text-[11px] uppercase tracking-[1px] font-mono transition-colors px-4 py-2 ${
              isActive
                ? 'border-b-2 border-primary text-foreground font-medium'
                : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
