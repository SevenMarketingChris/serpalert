'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowRight } from 'lucide-react'
import { TrackedLink } from '@/components/analytics/tracked-link'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false)

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 0) {
      setOpen(true)
      localStorage.setItem('serpalert_exit_shown', '1')
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('serpalert_exit_shown')) return

    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave)
    }, 5000)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [handleMouseLeave])

  useEffect(() => {
    if (open) {
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [open, handleMouseLeave])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">Before you go...</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Are competitors stealing your brand clicks right now?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <TrackedLink
            href="/audit"
            eventProperties={{ placement: 'exit_intent_popup', ctaLabel: 'Free Brand Audit', funnelStage: 'audit_start' }}
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Free Brand Audit
            <ArrowRight className="h-4 w-4" />
          </TrackedLink>
          <p className="text-sm text-muted-foreground">
            Takes 10 seconds. No signup required.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
