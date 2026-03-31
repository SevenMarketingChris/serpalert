'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ThreatCard } from '@/components/threat-card'
import { groupChecksIntoRuns, type CheckItem, type ScanRun } from '@/lib/group-checks'
import { isSafeUrl } from '@/lib/utils'

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


        <span className="ml-auto text-muted-foreground font-mono text-xs shrink-0">
          {formatScanTime(run.timestamp)}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {run.checks.map(check => {
            if (check.competitorCount === 0) {
              return (
                <div key={check.id} className="px-4 py-4 flex flex-col sm:flex-row gap-4">
                  {/* Left: details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-[10px] tracking-[0.5px] bg-emerald-500/10 text-emerald-500">
                        CLEAR
                      </span>
                      <span className="text-tech-purple font-mono text-sm">{check.keyword}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      No competitor ads detected for this keyword. Your organic listing is capturing all brand traffic.
                    </p>
                  </div>
                  {/* Right: screenshot */}
                  {check.screenshotUrl && isSafeUrl(check.screenshotUrl) ? (
                    <a
                      href={check.screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-full sm:w-64 h-44 rounded-lg border border-border overflow-hidden hover:opacity-90 transition-opacity shrink-0 bg-muted"
                    >
                      <Image
                        src={check.screenshotUrl}
                        alt={`SERP for "${check.keyword}"`}
                        fill
                        className="object-cover object-top"
                        sizes="256px"
                      />
                    </a>
                  ) : check.screenshotUrl ? (
                    <div className="relative w-full sm:w-64 h-44 rounded-lg border border-border overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground text-xs">Invalid screenshot URL</span>
                    </div>
                  ) : null}
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
  const [displayCount, setDisplayCount] = useState(10)

  const runs = useMemo(() => groupChecksIntoRuns(checks), [checks])

  const visible = runs.slice(0, displayCount)
  const hasMore = runs.length > displayCount

  if (checks.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
        No SERP checks yet — data will appear after the first scheduled check.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold font-mono">Activity Feed</h2>

      {visible.map((run, i) => (
        <ScanRunCard
          key={run.checks[0]?.id ?? run.timestamp}
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
          Load more ({runs.length - displayCount} remaining)
        </button>
      )}
    </div>
  )
}
