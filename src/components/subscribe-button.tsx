'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function SubscribeButton({ brandId }: { brandId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubscribe() {
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
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }
      try {
        const parsed = new URL(data.url)
        if (parsed.protocol !== 'https:') throw new Error('Invalid')
      } catch {
        setError('Invalid checkout URL received.')
        setLoading(false)
        return
      }
      window.location.href = data.url
      // Don't reset loading — page is navigating away
    } catch (err) {
      console.error('Failed to create checkout session:', err)
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        onClick={handleSubscribe}
        disabled={loading}
        size="sm"
        className="bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap"
      >
        {loading ? 'Loading...' : 'Subscribe — £149/mo'}
      </Button>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}
