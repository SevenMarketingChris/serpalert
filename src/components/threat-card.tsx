'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ScreenshotModal } from '@/components/screenshot-modal'
import { EvidenceModal } from '@/components/evidence-modal'
import { isSafeUrl } from '@/lib/utils'
import { formatScanTime } from '@/lib/time'

interface ThreatCardProps {
  checkId: string
  brandId: string
  brandToken: string
  ads: {
    id: string
    domain: string
    headline: string | null
    description: string | null
    displayUrl: string | null
    destinationUrl: string | null
    position: number | null
    status: string
  }[]
  keyword: string
  checkedAt: string
  screenshotUrl: string | null
  competitorCount: number
}

const badgeClassMap: Record<string, string> = {
  new: 'badge-new',
  acknowledged: 'badge-acknowledged',
  reported: 'badge-reported',
  resolved: 'badge-resolved',
}

const nextStatusMap: Record<string, { label: string; next: string }> = {
  new: { label: 'Acknowledge', next: 'acknowledged' },
  acknowledged: { label: 'Mark Reported', next: 'reported' },
  reported: { label: 'Resolve', next: 'resolved' },
}

export function ThreatCard({ checkId, brandId, brandToken, ads, keyword, checkedAt, screenshotUrl, competitorCount }: ThreatCardProps) {
  const router = useRouter()
  const [patching, setPatching] = useState(false)

  const firstAd = ads[0]
  if (!firstAd) return null

  const status = firstAd.status
  const badgeClass = badgeClassMap[status] ?? badgeClassMap.new
  const isResolved = status === 'resolved'
  const transition = nextStatusMap[status]

  async function handleStatusChange() {
    if (!transition) return
    setPatching(true)
    try {
      const res = await fetch(`/api/brands/${brandId}/checks/${checkId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: transition.next }),
      })
      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Status update failed:', error)
      alert('Failed to update status. Please try again.')
    } finally {
      setPatching(false)
    }
  }

  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${isResolved ? 'opacity-60' : ''}`}>
      {/* Left: details + context */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Header: status + keyword + time */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={badgeClass}>{status.toUpperCase()}</span>
          <span className="text-tech-purple font-mono text-sm">{keyword}</span>
          <span className="ml-auto text-muted-foreground font-mono text-xs">{formatScanTime(checkedAt)}</span>
        </div>

        {/* Context summary */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="text-sm font-medium text-foreground">
            {competitorCount} competitor{competitorCount !== 1 ? 's' : ''} bidding on your brand
          </p>
          <div className="space-y-1.5">
            {ads.map((ad, i) => (
              <div key={ad.id || i} className="text-xs space-y-0.5">
                <div>
                  <span className="font-semibold text-foreground">{ad.domain}</span>
                  {ad.position != null && (
                    <span className="text-muted-foreground"> · Position {ad.position}</span>
                  )}
                </div>
                {ad.headline && (
                  <p className="text-muted-foreground">&ldquo;{ad.headline}&rdquo;</p>
                )}
                {ad.description && (
                  <p className="text-muted-foreground text-[11px]">{ad.description}</p>
                )}
                {ad.displayUrl && (
                  <p className="text-muted-foreground text-[11px] font-mono">{ad.displayUrl}</p>
                )}
                {ad.destinationUrl && isSafeUrl(ad.destinationUrl) ? (
                  <a href={ad.destinationUrl} target="_blank" rel="noopener noreferrer"
                     className="text-[11px] text-primary/70 hover:text-primary hover:underline truncate block">
                    {ad.destinationUrl}
                  </a>
                ) : ad.destinationUrl ? (
                  <span className="text-muted-foreground text-[11px] truncate block">{ad.destinationUrl}</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <ScreenshotModal screenshotUrl={screenshotUrl} keyword={keyword} />
          <EvidenceModal
            checkId={checkId}
            brandToken={brandToken}
            keyword={keyword}
            checkedAt={checkedAt}
            screenshotUrl={screenshotUrl}
            ads={ads.map(a => ({
              domain: a.domain,
              headline: a.headline,
              description: a.description,
              displayUrl: a.displayUrl,
              destinationUrl: a.destinationUrl,
              position: a.position,
            }))}
          />
          {transition && (
            <button
              onClick={handleStatusChange}
              disabled={patching}
              className="action-btn disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {patching ? '...' : transition.label}
            </button>
          )}
        </div>
      </div>

      {/* Right: screenshot */}
      {screenshotUrl && isSafeUrl(screenshotUrl) ? (
        <a
          href={screenshotUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-full sm:w-64 h-44 rounded-lg border border-border overflow-hidden hover:opacity-90 transition-opacity shrink-0 bg-muted"
        >
          <Image
            src={screenshotUrl}
            alt={`SERP for "${keyword}"`}
            fill
            className="object-cover object-top"
            sizes="192px"
          />
        </a>
      ) : screenshotUrl ? (
        <div className="relative w-full sm:w-64 h-44 rounded-lg border border-border overflow-hidden shrink-0 bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-xs">Invalid screenshot URL</span>
        </div>
      ) : null}
    </div>
  )
}
