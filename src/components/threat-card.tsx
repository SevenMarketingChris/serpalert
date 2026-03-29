'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ScreenshotModal } from '@/components/screenshot-modal'
import { EvidenceModal } from '@/components/evidence-modal'

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

function formatTime(date: string): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
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
    <div className={`flex gap-4 ${isResolved ? 'opacity-60' : ''}`}>
      {/* Left: details + context */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Header: status + keyword + time */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={badgeClass}>{status.toUpperCase()}</span>
          <span className="text-tech-purple font-mono text-sm">{keyword}</span>
          <span className="ml-auto text-muted-foreground font-mono text-xs">{formatTime(checkedAt)}</span>
        </div>

        {/* Context summary */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="text-sm font-medium text-foreground">
            {competitorCount} competitor{competitorCount !== 1 ? 's' : ''} bidding on your brand
          </p>
          <div className="space-y-1.5">
            {ads.map((ad, i) => (
              <div key={ad.id || i} className="text-xs">
                <span className="font-semibold text-foreground">{ad.domain}</span>
                {ad.headline && (
                  <span className="text-muted-foreground"> — &ldquo;{ad.headline}&rdquo;</span>
                )}
                {ad.position != null && (
                  <span className="text-muted-foreground"> · Position {ad.position}</span>
                )}
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
              destinationUrl: null,
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
      {screenshotUrl && (
        <a
          href={screenshotUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-48 h-32 rounded-lg border border-border overflow-hidden hover:opacity-90 transition-opacity shrink-0 bg-muted"
        >
          <Image
            src={screenshotUrl}
            alt={`SERP for "${keyword}"`}
            fill
            className="object-cover object-top"
            sizes="192px"
          />
        </a>
      )}
    </div>
  )
}
