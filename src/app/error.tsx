'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
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
    <html>
      <body className="bg-background text-foreground">
        <div className="flex min-h-screen items-center justify-center">
          <div role="alert" className="text-center space-y-4 max-w-md px-6">
            <p className="text-xs uppercase tracking-widest text-tech-blue font-mono">System Error</p>
            <h1 className="text-2xl font-bold text-gradient-tech">Something went wrong</h1>
            <p className="text-muted-foreground text-sm">{error.message || 'An unexpected error occurred'}</p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={reset} variant="outline">Reload</Button>
              <Button onClick={() => window.location.href = '/'} variant="outline">Go Home</Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
