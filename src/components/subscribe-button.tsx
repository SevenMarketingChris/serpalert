'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function SubscribeButton({ brandId }: { brandId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Failed to create checkout session:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSubscribe}
      disabled={loading}
      size="sm"
      className="bg-primary text-primary-foreground"
    >
      {loading ? 'Loading…' : 'Subscribe — £149/mo'}
    </Button>
  )
}
