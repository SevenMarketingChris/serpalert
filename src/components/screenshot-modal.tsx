'use client'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function ScreenshotModal({ screenshotUrl, keyword }: { screenshotUrl: string | null; keyword: string }) {
  if (!screenshotUrl) return null
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label={`View SERP screenshot for ${keyword}`}
          />
        }
      >
        Screenshot
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <p className="text-sm font-medium mb-2 font-mono">
          SERP: <span className="text-neon-cyan">{keyword}</span>
        </p>
        <div className="rounded-lg overflow-hidden bg-muted">
          <Image
            src={screenshotUrl}
            alt={`SERP for ${keyword}`}
            width={1200}
            height={800}
            className="w-full h-auto"
            loading="lazy"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
