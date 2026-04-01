'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, ExternalLink, CheckCircle, AlertTriangle, Clock } from 'lucide-react'

interface Props {
  brandId: string
  subscriptionStatus: string
  trialEndsAt: string | null // ISO string
  agencyManaged: boolean
  hasStripeCustomer: boolean
}

function StatusBadge({ status, trialEndsAt }: { status: string; trialEndsAt: string | null }) {
  const isExpired = status === 'trialing' && trialEndsAt && new Date(trialEndsAt) <= new Date()

  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle className="h-3 w-3" />
        Active
      </span>
    )
  }
  if (status === 'trialing' && !isExpired) {
    const daysLeft = trialEndsAt
      ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
        <Clock className="h-3 w-3" />
        Trial — {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
      </span>
    )
  }
  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
        <AlertTriangle className="h-3 w-3" />
        Trial Expired
      </span>
    )
  }
  if (status === 'past_due') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        <AlertTriangle className="h-3 w-3" />
        Payment Failed
      </span>
    )
  }
  if (status === 'canceled') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
        <AlertTriangle className="h-3 w-3" />
        Canceled
      </span>
    )
  }
  if (status === 'agency') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
        <CheckCircle className="h-3 w-3" />
        Agency Managed
      </span>
    )
  }
  return null
}

export function BillingSection({ brandId, subscriptionStatus, trialEndsAt, agencyManaged, hasStripeCustomer }: Props) {
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const isExpired = subscriptionStatus === 'trialing' && trialEndsAt && new Date(trialEndsAt) <= new Date()
  const needsSubscription = isExpired || subscriptionStatus === 'canceled'
  const isActive = subscriptionStatus === 'active'
  const isPastDue = subscriptionStatus === 'past_due'

  async function openPortal() {
    setPortalLoading(true)
    setPortalError(null)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setPortalError(data.error ?? 'Failed to open billing portal')
        setPortalLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setPortalError('Network error')
      setPortalLoading(false)
    }
  }

  async function handleSubscribe() {
    setCheckoutLoading(true)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setCheckoutError(data.error ?? 'Failed to create checkout')
        setCheckoutLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setCheckoutError('Network error')
      setCheckoutLoading(false)
    }
  }

  if (agencyManaged) {
    return (
      <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg shadow-gray-200/20 space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 font-mono">Billing</h3>
          <p className="text-sm text-gray-500 mt-1">
            This brand is managed by your agency. Billing is handled separately.
          </p>
        </div>
        <StatusBadge status="agency" trialEndsAt={null} />
      </div>
    )
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg shadow-gray-200/20 space-y-5">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 font-mono">Billing</h3>
        <p className="text-sm text-gray-500 mt-1">
          Manage your subscription, update payment details, and view invoices.
        </p>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700">Subscription Status</p>
          <StatusBadge status={subscriptionStatus} trialEndsAt={trialEndsAt} />
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700">Plan</p>
          <p className="text-lg font-bold font-mono text-gray-900">£149<span className="text-sm font-normal text-gray-400">/mo</span></p>
        </div>
      </div>

      {/* Info based on status */}
      {isActive && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-sm text-emerald-700">
            Your monitoring is active. SERP checks run automatically throughout the day.
          </p>
        </div>
      )}

      {isPastDue && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-700">
            Your last payment failed. Monitoring is still running but will stop if payment is not updated. Please update your payment method.
          </p>
        </div>
      )}

      {needsSubscription && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">
            {isExpired
              ? 'Your trial has ended. Subscribe to resume monitoring and protect your brand.'
              : 'Your subscription has been canceled. Subscribe to resume monitoring.'}
          </p>
        </div>
      )}

      {subscriptionStatus === 'trialing' && !isExpired && trialEndsAt && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <p className="text-sm text-indigo-700">
            Your free trial is active. Subscribe before it ends to ensure uninterrupted monitoring. You won&apos;t be charged until your trial ends on{' '}
            <span className="font-semibold">{new Date(trialEndsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-1">
        {/* Manage billing (for active/past_due subscribers) */}
        {hasStripeCustomer && (isActive || isPastDue) && (
          <Button
            onClick={openPortal}
            disabled={portalLoading}
            variant="outline"
            className="gap-2"
          >
            <CreditCard className="h-4 w-4" />
            {portalLoading ? 'Opening...' : 'Manage Billing'}
            <ExternalLink className="h-3 w-3 opacity-50" />
          </Button>
        )}

        {/* Subscribe button (for trial/expired/canceled) */}
        {(needsSubscription || (subscriptionStatus === 'trialing' && !isExpired)) && (
          <Button
            onClick={handleSubscribe}
            disabled={checkoutLoading}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {checkoutLoading ? 'Loading...' : 'Subscribe — £149/mo'}
          </Button>
        )}

        {/* Update payment (for past_due) */}
        {hasStripeCustomer && isPastDue && (
          <Button
            onClick={openPortal}
            disabled={portalLoading}
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
          >
            {portalLoading ? 'Opening...' : 'Update Payment Method'}
          </Button>
        )}
      </div>

      {portalError && <p className="text-xs text-red-500">{portalError}</p>}
      {checkoutError && <p className="text-xs text-red-500">{checkoutError}</p>}

      {/* Help text */}
      <p className="text-[11px] text-gray-400">
        {hasStripeCustomer
          ? 'Use "Manage Billing" to update your card, view past invoices, or cancel your subscription. Powered by Stripe.'
          : 'Payments are securely processed by Stripe. You can cancel anytime from the billing portal.'}
      </p>
    </div>
  )
}
