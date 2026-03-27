'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Shield,
  BarChart3,
  Settings,
  Menu,
  X,
  Globe,
} from 'lucide-react'
import { BrandSwitcher } from './brand-switcher'

interface SidebarProps {
  brandId: string
  brandName: string
  brands: { id: string; name: string }[]
  plan: string
  keywordCount: number
  keywordLimit: number
  isAdmin: boolean
}

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview', path: '' },
  { icon: Shield, label: 'Competitors', path: '/competitors' },
  { icon: BarChart3, label: 'Insights', path: '/insights' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

export function Sidebar({
  brandId,
  brandName,
  brands,
  plan,
  keywordCount,
  keywordLimit,
  isAdmin,
}: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const basePath = `/dashboard/${brandId}`

  function isActive(itemPath: string) {
    const fullPath = `${basePath}${itemPath}`
    if (itemPath === '') {
      return pathname === basePath || pathname === `${basePath}/`
    }
    return pathname.startsWith(fullPath)
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-4 py-5">
        <span className="text-gradient-tech font-extrabold text-lg">SerpAlert</span>
      </div>

      {/* Brand Switcher */}
      <div className="px-2 pb-3">
        <BrandSwitcher
          currentBrandId={brandId}
          currentBrandName={brandName}
          brands={brands}
        />
      </div>

      {/* Admin link */}
      {isAdmin && (
        <div className="px-2 pb-2">
          <Link
            href="/admin/brands"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-[oklch(20%_0.03_250)] transition-colors"
          >
            <Globe className="h-4 w-4 shrink-0" />
            <span className="lg:inline md:hidden">All Brands</span>
          </Link>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              href={`${basePath}${item.path}`}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                active
                  ? 'sidebar-item-active'
                  : 'text-sidebar-foreground hover:bg-[oklch(20%_0.03_250)]'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="lg:inline md:hidden">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-3 border-t border-[oklch(22%_0.03_250)]" />

      {/* Plan info */}
      <div className="px-4 pb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:block md:hidden">
          {plan}
        </p>
        <p className="text-xs text-muted-foreground mt-1 lg:block md:hidden">
          {keywordCount}/{keywordLimit} keywords
        </p>
      </div>

      {/* Footer */}
      <div className="border-t border-[oklch(22%_0.03_250)] px-4 py-3">
        <p className="truncate text-xs text-muted-foreground lg:block md:hidden">
          SerpAlert
        </p>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-[oklch(14%_0.025_250)] px-4 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 text-sidebar-foreground hover:text-foreground transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-gradient-tech font-extrabold text-lg">SerpAlert</span>
        <div className="w-8" /> {/* Spacer for centering */}
      </div>

      {/* Mobile spacer so content isn't hidden behind the fixed bar */}
      <div className="h-14 md:hidden shrink-0" />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative flex h-full w-[260px] flex-col sidebar-bg">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 p-1 text-sidebar-foreground hover:text-foreground transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Tablet icon rail (md) + Desktop full sidebar (lg) */}
      <aside className="hidden md:flex md:w-14 lg:w-[220px] shrink-0 flex-col sidebar-bg border-r border-[oklch(22%_0.03_250)] min-h-screen sticky top-0 h-screen overflow-y-auto">
        {sidebarContent}
      </aside>
    </>
  )
}
