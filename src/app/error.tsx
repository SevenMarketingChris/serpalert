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
            <p className="text-muted-foreground text-sm">An unexpected error occurred. Please try again.</p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={reset} variant="outline">Reload</Button>
              <a href="/" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">Go Home</a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
