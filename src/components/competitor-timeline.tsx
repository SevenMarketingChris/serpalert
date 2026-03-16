'use client'
import { useState } from 'react'
import { SerpPreviewModal } from './serp-preview-modal'
import type { SerpCheck, CompetitorAd } from '@/lib/db/schema'

type CheckWithAds = SerpCheck & { ads: CompetitorAd[] }

function groupIntoScans(checks: CheckWithAds[]): CheckWithAds[][] {
  const map = new Map<string, CheckWithAds[]>()
  for (const check of checks) {
    const key = check.scanGroupId ?? new Date(check.checkedAt).toISOString().slice(0, 16)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(check)
  }
  return [...map.values()]
}

function AdCard({ ad, keyword }: { ad: CompetitorAd; keyword: string }) {
  return (
    <div className="bg-[var(--c-card)] rounded-xl border border-[var(--c-border)] p-3.5" style={{ boxShadow: 'var(--c-shadow-sm)' }}>
      <div className="flex items-start gap-2.5">
        <img
          src={`https://www.google.com/s2/favicons?domain=${ad.domain}&sz=32`}
          alt=""
          className="w-5 h-5 rounded-md mt-0.5 shrink-0 object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="inline-flex items-center text-[9px] border border-[#70757A]/40 text-[#70757A] px-1 py-px rounded uppercase tracking-wide font-medium">Ad</span>
            <span className="text-[11px] text-[var(--c-text-muted)] truncate">{ad.displayUrl ?? ad.domain}</span>
            <span className="text-[10px] text-[var(--c-text-faint)] ml-auto shrink-0">&ldquo;{keyword}&rdquo;</span>
          </div>
          {ad.headline && (
            <p className="text-[14px] font-medium text-[#1558D6] dark:text-[#8AB4F8] leading-snug mb-0.5">{ad.headline}</p>
          )}
          {ad.description && (
            <p className="text-[12px] text-[var(--c-text-muted)] leading-relaxed">{ad.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ScanRow({ scan, isLast }: { scan: CheckWithAds[]; isLast: boolean }) {
  const hasAds = scan.some(c => c.competitorCount > 0)
  const [expanded, setExpanded] = useState(hasAds)
  const totalAds = scan.reduce((n, c) => n + c.competitorCount, 0)
  const allAds = scan.flatMap(c => c.ads)
  const domains = [...new Set(allAds.map(a => a.domain))]
  const scanTime = new Date(scan[0].checkedAt)
  const time = scanTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const device = scan[0].device ?? 'Desktop'

  return (
    <div className="flex gap-4">
      {/* Timeline track */}
      <div className="flex flex-col items-center shrink-0 pt-1.5">
        <div className={`w-2 h-2 rounded-full shrink-0 ring-2 ring-[var(--c-bg)] ${hasAds ? 'bg-[#FF3B30]' : 'bg-[#30D158]'}`} />
        {!isLast && <div className="w-px flex-1 bg-[var(--c-border)] mt-2" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-5 min-w-0">
        <div
          className={`flex items-center gap-2 ${hasAds ? 'cursor-pointer select-none' : ''}`}
          onClick={hasAds ? () => setExpanded(e => !e) : undefined}
        >
          <span className="text-[13px] font-semibold text-[var(--c-text)] tabular-nums">{time}</span>
          <span className="text-[var(--c-text-faint)] text-[10px]">·</span>
          <span className="text-[12px] text-[var(--c-text-muted)]">{scan.length} kw</span>
          <span className="text-[var(--c-text-faint)] text-[10px]">·</span>
          <span className="text-[11px] text-[var(--c-text-faint)]">{device}</span>
          <div className="flex-1" />
          {hasAds ? (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FF3B30]/8 text-[#FF3B30] text-[11px] font-semibold rounded-full border border-[#FF3B30]/15">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30]" />
                {totalAds} ad{totalAds !== 1 ? 's' : ''} · {domains.slice(0, 2).join(', ')}{domains.length > 2 ? ` +${domains.length - 2}` : ''}
              </span>
              <svg
                className={`w-4 h-4 text-[var(--c-text-faint)] transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#30D158]/8 text-[#30D158] text-[11px] font-medium rounded-full border border-[#30D158]/15">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]" />
              Clean
            </span>
          )}
        </div>

        {hasAds && expanded && (
          <div className="space-y-2 mt-3">
            {scan.filter(c => c.ads.length > 0).flatMap(check =>
              check.ads.map(ad => <AdCard key={ad.id} ad={ad} keyword={check.keyword} />)
            )}
            <div className="flex justify-end pt-0.5">
              <SerpPreviewModal
                ads={allAds}
                keyword={scan[0].keyword}
                checkedAt={scanTime}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function CompetitorTimeline({ checks }: { checks: CheckWithAds[] }) {
  if (checks.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-12 h-12 rounded-2xl bg-[var(--c-card-secondary)] flex items-center justify-center mx-auto mb-4">
          <svg className="w-5 h-5 text-[var(--c-text-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-[var(--c-text-secondary)] text-[15px] font-semibold">No scans yet</p>
        <p className="text-[var(--c-text-muted)] text-[13px] mt-1">Hit &ldquo;Run check now&rdquo; or wait for the scheduled scan</p>
      </div>
    )
  }

  const scans = groupIntoScans(checks)
  const byDate = new Map<string, { scans: CheckWithAds[][]; label: string }>()

  for (const scan of scans) {
    const dateKey = new Date(scan[0].checkedAt).toDateString()
    const d = new Date(scan[0].checkedAt)
    const today = new Date()
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
    let label: string
    if (d.toDateString() === today.toDateString()) label = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday'
    else label = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!byDate.has(dateKey)) byDate.set(dateKey, { scans: [], label })
    byDate.get(dateKey)!.scans.push(scan)
  }

  return (
    <div className="space-y-8">
      {[...byDate.values()].map(({ label, scans: dayScans }) => {
        const dayDomains = new Set(dayScans.flatMap(s => s.flatMap(c => c.ads.map(a => a.domain))))
        return (
          <div key={label}>
            <div className="flex items-center gap-3 mb-4">
              <p className="text-[11px] font-semibold text-[var(--c-text-muted)] uppercase tracking-widest whitespace-nowrap">{label}</p>
              <div className="flex-1 h-px bg-[var(--c-border)]" />
              {dayDomains.size > 0 ? (
                <span className="text-[11px] font-semibold text-[#FF3B30] bg-[#FF3B30]/8 px-2.5 py-0.5 rounded-full border border-[#FF3B30]/15 shrink-0">
                  {dayDomains.size} competitor{dayDomains.size !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-[#30D158] bg-[#30D158]/8 px-2.5 py-0.5 rounded-full border border-[#30D158]/15 shrink-0">
                  All clean
                </span>
              )}
            </div>
            <div className="pl-1">
              {dayScans.map((scan, i) => (
                <ScanRow
                  key={scan[0].scanGroupId ?? scan[0].id}
                  scan={scan}
                  isLast={i === dayScans.length - 1}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
