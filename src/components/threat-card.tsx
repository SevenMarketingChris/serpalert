'use client'

import { useState } from 'react'
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
  checkedAt: Date
  screenshotUrl: string | null
  competitorCount: number
}

const borderColorMap: Record<string, string> = {
  new: 'oklch(52% 0.22 15)',
  acknowledged: 'oklch(62% 0.22 250)',
  reported: 'oklch(72% 0.15 55)',
  resolved: 'oklch(72% 0.15 195)',
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

function formatTime(date: Date): string {
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
  const borderColor = borderColorMap[status] ?? borderColorMap.new
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
    <div
      className={`bg-card border border-edge rounded-lg p-3.5 ${isResolved ? 'opacity-70' : ''}`}
      style={{ borderLeftWidth: '3px', borderLeftColor: borderColor }}
    >
      {/* Row 1: Status + domain + keyword + timestamp */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={badgeClass}>{status.toUpperCase()}</span>
        <span className="font-semibold text-sm">{firstAd.domain}</span>
        <span className="text-muted-foreground text-xs">on</span>
        <span className="text-tech-purple font-mono text-sm">{keyword}</span>
        <span className="ml-auto text-muted-foreground font-mono text-xs">{formatTime(checkedAt)}</span>
      </div>

      {/* Row 2: Ad copy snippet */}
      {(firstAd.headline || firstAd.position != null) && (
        <div className="text-muted-foreground text-xs mt-1.5">
          Ad: &ldquo;{firstAd.headline ?? 'No headline'}&rdquo;
          {firstAd.position != null && <> &middot; Position {firstAd.position}</>}
        </div>
      )}

      {/* Row 3: Actions */}
      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
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
        <span className={`ml-auto ${badgeClass} ${status === 'new' ? 'neon-glow-hero' : ''}`}>
          {status.toUpperCase()}
        </span>
      </div>
    </div>
  )
}
