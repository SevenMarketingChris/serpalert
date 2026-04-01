'use client'

import { useState } from 'react'
import { Zap, Check } from 'lucide-react'

interface Props {
  brandId: string
  isExpired: boolean
  isCanceled: boolean
  daysLeft: number | null
}

export function UpgradeBanner({ brandId, isExpired, isCanceled, daysLeft }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Something went wrong')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch (err) {
      console.error('Checkout error:', err)
      setError('Unable to connect. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className={`rounded-2xl overflow-hidden shadow-lg ${
      isExpired || isCanceled
        ? 'bg-gradient-to-r from-red-50/80 to-amber-50/80 backdrop-blur-lg border border-red-200/40'
        : 'bg-gradient-to-r from-indigo-50/80 to-violet-50/80 backdrop-blur-lg border border-indigo-200/40'
    }`}>
      <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isExpired || isCanceled ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
          }`}>
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-sm font-semibold ${isExpired || isCanceled ? 'text-red-900' : 'text-indigo-900'}`}>
              {isExpired && 'Your monitoring has paused'}
              {isCanceled && 'Your monitoring has paused'}
              {!isExpired && !isCanceled && daysLeft !== null && (
                daysLeft <= 3
                  ? `Your brand protection ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
                  : 'Keep your brand protected'
              )}
            </p>
            <p className={`text-xs mt-0.5 ${isExpired || isCanceled ? 'text-red-600' : 'text-indigo-600'}`}>
              {isExpired || isCanceled
                ? 'Your competitors could be bidding right now. Upgrade to resume protection.'
                : 'Lock in continuous hourly monitoring so you never miss a competitor.'
              }
            </p>
            {!isExpired && !isCanceled && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                <span className="text-[11px] text-indigo-500 flex items-center gap-1"><Check className="w-3 h-3" /> 24/7 hourly monitoring</span>
                <span className="text-[11px] text-indigo-500 flex items-center gap-1"><Check className="w-3 h-3" /> AI-powered insights</span>
                <span className="text-[11px] text-indigo-500 flex items-center gap-1"><Check className="w-3 h-3" /> Instant Slack alerts</span>
                <span className="text-[11px] text-indigo-500 flex items-center gap-1"><Check className="w-3 h-3" /> Monthly reports</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className={`inline-flex h-10 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white transition-all whitespace-nowrap shadow-lg ${
              isExpired || isCanceled
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/25'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25'
            } disabled:opacity-50`}
          >
            {loading ? 'Loading...' : isExpired || isCanceled ? 'Resume Protection — £149/mo' : 'Continue Protection — £149/mo'}
          </button>
          <p className="text-[10px] text-gray-400">Cancel anytime</p>
        </div>
      </div>
      {error && <p className="px-5 pb-3 text-xs text-red-500">{error}</p>}
    </div>
  )
}
