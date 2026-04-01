'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="max-w-5xl py-12 text-center space-y-4">
      <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
      <h2 className="text-lg font-semibold">Competitors failed to load</h2>
      <p className="text-sm text-muted-foreground">
        The competitors section encountered an error. Try refreshing.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Try Again
      </button>
    </div>
  )
}
