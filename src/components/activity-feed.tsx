'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { StatusFilter } from '@/components/status-filter'
import { ThreatCard } from '@/components/threat-card'
import { groupChecksIntoRuns, type CheckItem, type ScanRun } from '@/lib/group-checks'

interface ActivityFeedProps {
  checks: CheckItem[]
  brandId: string
  brandToken: string
}

function formatScanTime(date: string): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
    ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function ScanRunCard({ run, brandId, brandToken, defaultExpanded }: {
  run: ScanRun
  brandId: string
  brandToken: string
  defaultExpanded: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const hasThreat = run.totalThreats > 0
  const screenshots = run.checks.filter(c => c.screenshotUrl)

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 p-3.5 text-left hover:bg-accent/50 transition-colors ${
          hasThreat ? 'border-l-3 border-l-red-500' : 'border-l-3 border-l-emerald-500'
        }`}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        <span className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-[10px] tracking-[0.5px] ${
          hasThreat ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
        }`}>
          {hasThreat ? `${run.totalThreats} THREAT${run.totalThreats !== 1 ? 'S' : ''}` : 'CLEAR'}
        </span>

        <span className="text-sm text-foreground">
          {run.totalKeywords} keyword{run.totalKeywords !== 1 ? 's' : ''} checked
        </span>

        {run.screenshotCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {run.screenshotCount} screenshot{run.screenshotCount !== 1 ? 's' : ''}
          </span>
        )}

        {!expanded && screenshots.length > 0 && (
          <div className="hidden sm:flex items-center gap-1 ml-1">
            {screenshots.slice(0, 3).map(c => (
              <div key={c.id} className="relative w-12 h-8 rounded border border-border overflow-hidden shrink-0">
                <Image
                  src={c.screenshotUrl!}
                  alt={c.keyword}
                  fill
                  className="object-cover object-top"
                  sizes="48px"
                />
              </div>
            ))}
            {screenshots.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{screenshots.length - 3}</span>
            )}
          </div>
        )}

        <span className="ml-auto text-muted-foreground font-mono text-xs shrink-0">
          {formatScanTime(run.timestamp)}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {run.checks.map(check => {
            if (check.competitorCount === 0) {
              return (
                <div key={check.id} className="px-4 py-2.5 flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-[10px] tracking-[0.5px] bg-emerald-500/10 text-emerald-500">
                    CLEAR
                  </span>
                  <span className="text-tech-purple font-mono text-sm">{check.keyword}</span>
                  {check.screenshotUrl && (
                    <a
                      href={check.screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-24 h-16 rounded border border-border overflow-hidden hover:opacity-80 transition-opacity shrink-0"
                      title="View SERP screenshot"
                    >
                      <Image
                        src={check.screenshotUrl}
                        alt={`SERP for "${check.keyword}"`}
                        fill
                        className="object-cover object-top"
                        sizes="96px"
                      />
                    </a>
                  )}
                </div>
              )
            }

            return (
              <div key={check.id} className="p-3.5">
                <ThreatCard
                  checkId={check.id}
                  brandId={brandId}
                  brandToken={brandToken}
                  ads={check.ads}
                  keyword={check.keyword}
                  checkedAt={check.checkedAt}
                  screenshotUrl={check.screenshotUrl}
                  competitorCount={check.competitorCount}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ActivityFeed({ checks, brandId, brandToken }: ActivityFeedProps) {
  const [filter, setFilter] = useState('unresolved')
  const [displayCount, setDisplayCount] = useState(10)

  const runs = groupChecksIntoRuns(checks)

  const filtered = runs.filter(run => {
    switch (filter) {
      case 'all':
        return true
      case 'new':
        return run.totalThreats === 0 || run.checks.some(c => c.ads.some(a => a.status === 'new'))
      case 'unresolved':
        return run.totalThreats === 0 || run.hasUnresolved
      case 'resolved':
        return run.totalThreats > 0 && !run.hasUnresolved
      default:
        return true
    }
  })

  const visible = filtered.slice(0, displayCount)
  const hasMore = filtered.length > displayCount

  if (checks.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
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
        <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
          No checks match the current filter.
        </div>
      )}

      {visible.map((run, i) => (
        <ScanRunCard
          key={run.timestamp + i}
          run={run}
          brandId={brandId}
          brandToken={brandToken}
          defaultExpanded={run.totalThreats > 0}
        />
      ))}

      {hasMore && (
        <button
          onClick={() => setDisplayCount(c => c + 10)}
          className="w-full bg-card border border-border rounded-lg py-2.5 text-xs font-mono text-muted-foreground hover:bg-card/80 transition-colors cursor-pointer"
        >
          Load more ({filtered.length - displayCount} remaining)
        </button>
      )}
    </div>
  )
}
