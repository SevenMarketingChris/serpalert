'use client'

import type { Brand } from '@/lib/db/schema'
import { SubscribeButton } from './subscribe-button'

export function SubscribeBanner({ brand }: { brand: Brand }) {
  const now = new Date()
  const isExpired = brand.subscriptionStatus === 'trialing' && brand.trialEndsAt && brand.trialEndsAt <= now
  const isCanceled = brand.subscriptionStatus === 'canceled'
  const isTrialing = brand.subscriptionStatus === 'trialing' && brand.trialEndsAt && brand.trialEndsAt > now

  if (isCanceled) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-red-700">Subscription canceled for {brand.name}</p>
          <p className="text-xs text-red-600">Monitoring is paused. Subscribe to resume protecting your brand.</p>
        </div>
        <SubscribeButton brandId={brand.id} />
      </div>
    )
  }

  if (isExpired) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-red-700">Trial expired for {brand.name}</p>
          <p className="text-xs text-red-600">Your monitoring is paused. Subscribe to resume protecting your brand.</p>
        </div>
        <SubscribeButton brandId={brand.id} />
      </div>
    )
  }

  if (isTrialing) {
    const daysLeft = Math.ceil((brand.trialEndsAt!.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysLeft > 3) return null
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-amber-700">
            {daysLeft} day{daysLeft !== 1 ? 's' : ''} left in your trial for {brand.name}
          </p>
          <p className="text-xs text-amber-600">Subscribe to keep monitoring after your trial ends.</p>
        </div>
        <SubscribeButton brandId={brand.id} />
      </div>
    )
  }

  return null
}
