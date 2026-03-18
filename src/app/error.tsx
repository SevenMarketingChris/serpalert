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
          <div className="text-center space-y-4 max-w-md px-6">
            <p className="text-xs uppercase tracking-widest text-neon-pink font-mono">System Error</p>
            <h1 className="text-2xl font-bold text-gradient-neon">Something went wrong</h1>
            <p className="text-muted-foreground text-sm">{error.message}</p>
            <Button onClick={reset} variant="outline">Reload</Button>
          </div>
        </div>
      </body>
    </html>
  )
}
