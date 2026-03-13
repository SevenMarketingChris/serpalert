'use client'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

export function ScreenshotModal({ screenshotUrl, keyword }: { screenshotUrl: string | null; keyword: string }) {
  if (!screenshotUrl) return null
  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center justify-center rounded-md border border-input px-3 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
        Screenshot
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <p className="text-sm font-medium mb-2">SERP: {keyword}</p>
        <img src={screenshotUrl} alt={`SERP for ${keyword}`} className="w-full rounded border" />
      </DialogContent>
    </Dialog>
  )
}
