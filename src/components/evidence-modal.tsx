'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'

interface EvidenceModalProps {
  checkId: string
  brandToken: string
  keyword: string
  checkedAt: string
  screenshotUrl: string | null
  ads: {
    domain: string
    headline: string | null
    description: string | null
    displayUrl: string | null
    destinationUrl: string | null
    position: number | null
  }[]
}

function formatDateTime(date: string): string {
  const d = new Date(date)
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function EvidenceModal({ checkId, brandToken, keyword, checkedAt, screenshotUrl, ads }: EvidenceModalProps) {
  const [copied, setCopied] = useState(false)

  function handleCopyLink() {
    const url = `${window.location.origin}/evidence/${checkId}?token=${brandToken}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleOpenNewTab() {
    window.open(`/evidence/${checkId}?token=${brandToken}`, '_blank')
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          (props) => (
            <button {...props} className="action-btn">
              📋 Evidence
            </button>
          )
        }
      />
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogTitle className="font-semibold">Evidence Report</DialogTitle>

        {/* Screenshot */}
        {screenshotUrl && (
          <div className="relative rounded-lg overflow-hidden">
            <img
              src={screenshotUrl}
              alt={`SERP screenshot for ${keyword}`}
              className="w-full rounded-lg"
            />
            <span className="absolute bottom-2 right-2 bg-black/70 text-white font-mono text-xs px-2 py-1 rounded">
              {formatDateTime(checkedAt)}
            </span>
          </div>
        )}

        {/* Ads */}
        <div className="space-y-3">
          {ads.map((ad, i) => (
            <div key={ad.domain + '-' + (ad.position ?? i)} className="border border-border rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-sm">{ad.domain}</span>
                {ad.position != null && (
                  <span className="bg-tech-purple/10 text-tech-purple text-xs font-mono px-2 py-0.5 rounded">
                    Position {ad.position}
                  </span>
                )}
              </div>
              {ad.headline && (
                <p className="text-primary text-sm">{ad.headline}</p>
              )}
              {ad.description && (
                <p className="text-muted-foreground text-sm">{ad.description}</p>
              )}
              {ad.displayUrl && (
                <p className="font-mono text-xs text-muted-foreground">{ad.displayUrl}</p>
              )}
              {ad.destinationUrl && (
                <a href={ad.destinationUrl} target="_blank" rel="noopener noreferrer"
                   className="font-mono text-xs text-primary/70 hover:text-primary hover:underline truncate block">
                  {ad.destinationUrl}
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Metadata */}
        <div className="border-t border-border pt-3 space-y-1 text-sm text-muted-foreground">
          <p><span className="font-semibold text-foreground">Keyword:</span> {keyword}</p>
          <p><span className="font-semibold text-foreground">Date/Time:</span> {formatDateTime(checkedAt)}</p>
          <p><span className="font-semibold text-foreground">Location:</span> United Kingdom</p>
          <p><span className="font-semibold text-foreground">Device:</span> Desktop</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button onClick={handleCopyLink} className="action-btn">
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button onClick={handleOpenNewTab} className="action-btn">
            Open in New Tab
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
