'use client'

import { useState } from 'react'
import { StatusFilter } from '@/components/status-filter'
import { ThreatCard } from '@/components/threat-card'

interface ActivityFeedProps {
  checks: {
    id: string
    keyword: string
    checkedAt: Date
    competitorCount: number
    screenshotUrl: string | null
    ads: {
      id: string
      domain: string
      headline: string | null
      description: string | null
      displayUrl: string | null
      position: number | null
      status: string
    }[]
  }[]
  brandId: string
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

export function ActivityFeed({ checks, brandId }: ActivityFeedProps) {
  const [filter, setFilter] = useState('unresolved')
  const [displayCount, setDisplayCount] = useState(20)

  const filtered = checks.filter((check) => {
    const isClear = check.competitorCount === 0

    switch (filter) {
      case 'all':
        return true
      case 'new':
        if (isClear) return true
        return check.ads.some((a) => a.status === 'new')
      case 'unresolved':
        if (isClear) return true
        return check.ads.some((a) => ['new', 'acknowledged', 'reported'].includes(a.status))
      case 'resolved':
        if (isClear) return false
        return check.ads.length > 0 && check.ads.every((a) => a.status === 'resolved')
      default:
        return true
    }
  })

  const visible = filtered.slice(0, displayCount)
  const hasMore = filtered.length > displayCount

  if (checks.length === 0) {
    return (
      <div className="bg-card border border-edge rounded-lg p-8 text-center text-muted-foreground text-sm">
        No SERP checks yet — data will appear after the first scheduled check.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold font-mono">Activity Feed</h2>
        <StatusFilter value={filter} onChange={setFilter} />
      </div>

      {visible.length === 0 && (
        <div className="bg-card border border-edge rounded-lg p-8 text-center text-muted-foreground text-sm">
          No checks match the current filter.
        </div>
      )}

      {visible.map((check) => {
        if (check.competitorCount === 0) {
          return (
            <div
              key={check.id}
              className="bg-card border border-edge rounded-lg p-3.5"
              style={{ borderLeftWidth: '3px', borderLeftColor: 'oklch(52% 0.20 145)' }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-[10px] tracking-[0.5px]"
                  style={{
                    background: 'oklch(52% 0.20 145 / 0.12)',
                    color: 'oklch(52% 0.20 145)',
                  }}
                >
                  CLEAR
                </span>
                <span className="text-tech-purple font-mono text-sm">{check.keyword}</span>
                <span className="ml-auto text-muted-foreground font-mono text-xs">
                  {formatTime(check.checkedAt)}
                </span>
              </div>
            </div>
          )
        }

        return (
          <ThreatCard
            key={check.id}
            checkId={check.id}
            brandId={brandId}
            ads={check.ads}
            keyword={check.keyword}
            checkedAt={check.checkedAt}
            screenshotUrl={check.screenshotUrl}
            competitorCount={check.competitorCount}
          />
        )
      })}

      {hasMore && (
        <button
          onClick={() => setDisplayCount((c) => c + 20)}
          className="w-full bg-card border border-edge rounded-lg py-2.5 text-xs font-mono text-muted-foreground hover:bg-card/80 transition-colors cursor-pointer"
        >
          Load more ({filtered.length - displayCount} remaining)
        </button>
      )}
    </div>
  )
}
