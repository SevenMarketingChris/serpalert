'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { isSafeUrl } from '@/lib/utils'

export function ScreenshotModal({ screenshotUrl, keyword }: { screenshotUrl: string | null; keyword: string }) {
  const [imageError, setImageError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (!screenshotUrl || !isSafeUrl(screenshotUrl)) return null
  return (
    <Dialog>
      <DialogTrigger
        render={
          (props) => (
            <Button
              {...props}
              variant="outline"
              size="sm"
              aria-label={`View SERP screenshot for ${keyword}`}
            >
              Screenshot
            </Button>
          )
        }
      />
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <p className="text-sm font-medium mb-2 font-mono">
          SERP: <span className="text-primary">{keyword}</span>
        </p>
        <div className="rounded-lg overflow-hidden bg-muted relative">
          {imageError ? (
            <div className="p-12 text-center text-muted-foreground text-sm">Screenshot unavailable</div>
          ) : (
            <>
              {!loaded && (
                <div className="absolute inset-0 bg-muted animate-pulse" />
              )}
              <Image
                src={screenshotUrl}
                alt={`SERP for ${keyword}`}
                width={1200}
                height={800}
                className="w-full h-auto"
                loading="lazy"
                onError={() => setImageError(true)}
                onLoad={() => setLoaded(true)}
              />
            </>
          )}
        </div>
        {isSafeUrl(screenshotUrl) && (
          <a
            href={screenshotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline mt-1 inline-block"
          >
            Open full size
          </a>
        )}
      </DialogContent>
    </Dialog>
  )
}
