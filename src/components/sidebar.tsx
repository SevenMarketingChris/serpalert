'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Shield,
  Camera,
  Settings,
  Menu,
  X,
  Globe,
} from 'lucide-react'
import { BrandSwitcher } from './brand-switcher'
import { getRelativeTime } from '@/lib/time'

interface SidebarProps {
  brandId: string
  brandName: string
  brands: { id: string; name: string }[]
  lastCheckTime: Date | null
  isAdmin: boolean
  subscriptionStatus: string
  trialEndsAt: Date | null
  agencyManaged: boolean
}

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview', path: '' },
  { icon: Shield, label: 'Competitors', path: '/competitors' },
  { icon: Camera, label: 'Screenshots', path: '/screenshots' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

function SubscriptionBadge({
  subscriptionStatus,
  trialEndsAt,
  agencyManaged,
}: {
  subscriptionStatus: string
  trialEndsAt: Date | null
  agencyManaged: boolean
}) {
  if (agencyManaged) {
    return (
      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
        Agency
      </span>
    )
  }

  if (subscriptionStatus === 'trialing' && trialEndsAt) {
    const now = new Date()
    const diffMs = Math.max(0, new Date(trialEndsAt).getTime() - now.getTime())
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
        Trial ({daysLeft} {daysLeft === 1 ? 'day' : 'days'} left)
      </span>
    )
  }

  if (subscriptionStatus === 'active') {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
        Active
      </span>
    )
  }

  // Fallback for other statuses (past_due, cancelled, etc.)
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600">
      {subscriptionStatus}
    </span>
  )
}

export function Sidebar({
  brandId,
  brandName,
  brands,
  lastCheckTime,
  isAdmin,
  subscriptionStatus,
  trialEndsAt,
  agencyManaged,
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

  function renderSidebarContent(mobile: boolean) {
    // mobile=true: shown in hamburger drawer (no responsive hiding)
    // mobile=false: shown in tablet icon rail / desktop full sidebar (hide text at md, show at lg)
    const textClass = mobile ? 'inline' : 'hidden lg:inline'
    const blockClass = mobile ? 'block' : 'hidden lg:block'

    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="px-4 py-5">
          <span className="font-extrabold text-lg bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">
            SerpAlert
          </span>
        </div>

        {/* Brand name or switcher */}
        <div className="px-2 pb-2">
          {brands.length > 1 ? (
            <BrandSwitcher
              currentBrandId={brandId}
              currentBrandName={brandName}
              brands={brands}
            />
          ) : (
            <p className={`px-3 py-1 text-sm font-semibold text-gray-900 truncate ${blockClass}`}>
              {brandName}
            </p>
          )}
        </div>

        {/* Last check time */}
        {lastCheckTime && (
          <p className={`px-4 pb-3 text-[10px] text-gray-400 font-mono ${blockClass}`}>
            Last check: {getRelativeTime(lastCheckTime)}
          </p>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                href={`${basePath}${item.path}`}
                title={item.label}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                  active
                    ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className={textClass}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Divider */}
        <div className="mx-4 my-3 border-t border-gray-200" />

        {/* Subscription badge */}
        <div className={`px-4 pb-3 ${blockClass}`}>
          <SubscriptionBadge
            subscriptionStatus={subscriptionStatus}
            trialEndsAt={trialEndsAt}
            agencyManaged={agencyManaged}
          />
        </div>

        {/* Admin link at very bottom */}
        {isAdmin && (
          <div className="px-2 pb-3 mt-auto">
            <Link
              href="/admin/brands"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <Globe className="h-4 w-4 shrink-0" />
              <span className={textClass}>Admin Panel</span>
            </Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-[#f5f5f7] px-4 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-extrabold text-lg bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">
          SerpAlert
        </span>
        <div className="w-8" />
      </div>

      {/* Mobile spacer */}
      <div className="h-14 md:hidden shrink-0" />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-[260px] flex-col bg-[#f5f5f7]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 p-1 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Tablet icon rail (md) + Desktop full sidebar (lg) */}
      <aside className="hidden md:flex md:w-14 lg:w-[220px] shrink-0 flex-col bg-[#f5f5f7] border-r border-gray-200 min-h-screen sticky top-0 h-screen overflow-y-auto">
        {renderSidebarContent(false)}
      </aside>
    </>
  )
}
