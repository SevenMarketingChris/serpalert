'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { TrackedLink } from '@/components/analytics/tracked-link'

const navLinks = [
  { href: '/calculator', label: 'Calculator' },
  { href: '/pricing', label: 'Pricing' },
]

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="border-b border-white/30 bg-white/70 backdrop-blur-xl px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        {/* Logo */}
        <TrackedLink
          href="/"
          eventProperties={{ placement: 'header_logo', funnelStage: 'acquisition' }}
          className="text-gradient-tech font-extrabold text-xl"
        >
          SerpAlert
        </TrackedLink>

        {/* Desktop: nav links + actions all together on the right */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <TrackedLink
              key={link.href}
              href={link.href}
              eventProperties={{
                placement: 'header_nav',
                funnelStage: 'acquisition',
                ctaLabel: link.label,
              }}
              className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
            >
              {link.label}
            </TrackedLink>
          ))}

          <span className="h-4 w-px bg-gray-200" />

          <TrackedLink
            href="/sign-in"
            eventProperties={{ placement: 'header_sign_in', funnelStage: 'auth' }}
            className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            Sign In
          </TrackedLink>
          <TrackedLink
            href="/sign-up"
            eventProperties={{ placement: 'header_trial', funnelStage: 'signup_start' }}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Start Free Trial
          </TrackedLink>
          <TrackedLink
            href="/audit"
            eventProperties={{ placement: 'header_audit', funnelStage: 'audit_start' }}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 shadow-lg shadow-indigo-500/25"
          >
            Free Audit
          </TrackedLink>
        </div>

        {/* Mobile: just the audit button + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <TrackedLink
            href="/audit"
            eventProperties={{ placement: 'header_audit_mobile', funnelStage: 'audit_start' }}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Free Audit
          </TrackedLink>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="mt-3 space-y-1 border-t border-gray-100 pt-3 md:hidden">
          {navLinks.map((link) => (
            <TrackedLink
              key={link.href}
              href={link.href}
              eventProperties={{
                placement: 'header_nav_mobile',
                funnelStage: 'acquisition',
                ctaLabel: link.label,
              }}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </TrackedLink>
          ))}
          <TrackedLink
            href="/sign-in"
            eventProperties={{ placement: 'header_sign_in_mobile', funnelStage: 'auth' }}
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            onClick={() => setMobileOpen(false)}
          >
            Sign In
          </TrackedLink>
          <TrackedLink
            href="/sign-up"
            eventProperties={{ placement: 'header_trial_mobile', funnelStage: 'signup_start' }}
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            onClick={() => setMobileOpen(false)}
          >
            Start Free Trial
          </TrackedLink>
        </div>
      )}
    </nav>
  )
}
