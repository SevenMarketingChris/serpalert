# SerpAlert UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the SerpAlert dashboard UX to group activity by scan run, add at-a-glance brand health metrics, improve screenshot presentation, and add notification badges — based on competitor analysis of Adthena, BrandVerity, SERPWatch, and Ahrefs.

**Architecture:** Server Components fetch grouped data from DB queries. Client Components handle expand/collapse and filtering. No new packages needed — all changes use existing Tailwind + Lucide icons. The key data change is grouping serp_checks by timestamp proximity into "scan runs".

**Tech Stack:** Next.js 16 App Router, Tailwind CSS, Drizzle ORM, Neon Postgres, Lucide React icons

**Build locally:** Run `cd "/Users/chris/Claude Code/serpalert" && npm run build` after each task. Do NOT push to git or deploy until all tasks pass.

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/lib/group-checks.ts` | Group check rows into scan runs |
| Modify | `src/lib/db/queries.ts` | Add `getRecentChecksWithAds`, `getThreatCountLast7Days`, `getLastCheckTime` |
| Modify | `src/components/activity-feed.tsx` | Render grouped scan runs instead of individual rows |
| Modify | `src/components/status-hero.tsx` | Merge metric cards into hero banner |
| Delete | `src/components/metric-cards.tsx` | Replaced by combined hero |
| Modify | `src/app/dashboard/[brandId]/page.tsx` | Use new grouped data, remove MetricCards import |
| Modify | `src/app/dashboard/page.tsx` | Add last check time, threat count, summary bar, clickable cards |
| Modify | `src/app/dashboard/[brandId]/screenshots/page.tsx` | Group by date, larger thumbnails |
| Modify | `src/components/sidebar.tsx` | Add unresolved threat badge, last check time |
| Modify | `src/app/dashboard/[brandId]/layout.tsx` | Pass threat count + last check to sidebar |
| Modify | `src/app/admin/brands/page.tsx` | Add last check column, summary stats row |

---

### Task 1: Create scan-run grouping utility

**Files:**
- Create: `src/lib/group-checks.ts`

- [ ] **Step 1: Create the grouping utility**

This groups individual check rows into "scan runs" by detecting checks that occurred within 5 minutes of each other (same scan batch).

```typescript
// src/lib/group-checks.ts

export interface CheckItem {
  id: string
  keyword: string
  checkedAt: string
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
}

export interface ScanRun {
  timestamp: string
  checks: CheckItem[]
  totalKeywords: number
  totalThreats: number
  screenshotCount: number
  hasUnresolved: boolean
}

/**
 * Group individual check rows into scan runs.
 * Checks within 5 minutes of each other are considered part of the same scan.
 */
export function groupChecksIntoRuns(checks: CheckItem[]): ScanRun[] {
  if (checks.length === 0) return []

  const runs: ScanRun[] = []
  let currentRun: CheckItem[] = [checks[0]]

  for (let i = 1; i < checks.length; i++) {
    const prev = new Date(checks[i - 1].checkedAt).getTime()
    const curr = new Date(checks[i].checkedAt).getTime()
    const diffMs = Math.abs(prev - curr)

    if (diffMs <= 5 * 60 * 1000) {
      // Same scan run
      currentRun.push(checks[i])
    } else {
      // New scan run
      runs.push(buildRun(currentRun))
      currentRun = [checks[i]]
    }
  }

  // Push the last run
  runs.push(buildRun(currentRun))
  return runs
}

function buildRun(checks: CheckItem[]): ScanRun {
  return {
    timestamp: checks[0].checkedAt,
    checks,
    totalKeywords: checks.length,
    totalThreats: checks.reduce((sum, c) => sum + c.competitorCount, 0),
    screenshotCount: checks.filter(c => c.screenshotUrl).length,
    hasUnresolved: checks.some(c =>
      c.ads.some(a => ['new', 'acknowledged', 'reported'].includes(a.status))
    ),
  }
}
```

- [ ] **Step 2: Build to verify**

Run: `cd "/Users/chris/Claude Code/serpalert" && npm run build 2>&1 | tail -5`
Expected: Build passes (file is not imported yet, but should have no syntax errors)

---

### Task 2: Add new DB queries

**Files:**
- Modify: `src/lib/db/queries.ts`
- Modify: `src/app/dashboard/page.tsx` (will use `getLastCheckTime` and threat count)

- [ ] **Step 1: Add `getThreatCountLast7Days` query**

Add this function to `src/lib/db/queries.ts` after the existing `getLastCheckForBrand` function:

```typescript
export async function getThreatCountLast7Days(brandId: string): Promise<number> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const rows = await db.select({ count: count() })
    .from(competitorAds)
    .where(and(
      eq(competitorAds.brandId, brandId),
      gte(competitorAds.firstSeenAt, cutoff),
    ))
  return rows[0]?.count ?? 0
}
```

Make sure `count` is imported from `drizzle-orm` (it should already be — check the existing imports at the top of the file).

- [ ] **Step 2: Add `getUnresolvedThreatCount` query**

Add after the previous function:

```typescript
export async function getUnresolvedThreatCount(brandId: string): Promise<number> {
  const rows = await db.select({ count: count() })
    .from(competitorAds)
    .where(and(
      eq(competitorAds.brandId, brandId),
      inArray(competitorAds.status, ['new', 'acknowledged', 'reported']),
    ))
  return rows[0]?.count ?? 0
}
```

- [ ] **Step 3: Build to verify**

Run: `cd "/Users/chris/Claude Code/serpalert" && npm run build 2>&1 | tail -5`
Expected: Build passes

---

### Task 3: Redesign activity feed with grouped scan runs

**Files:**
- Modify: `src/components/activity-feed.tsx`

- [ ] **Step 1: Rewrite activity-feed.tsx**

Replace the entire file content. The key changes:
- Import and use `groupChecksIntoRuns` from `@/lib/group-checks`
- Each scan run renders as a collapsible card showing "28 Mar, 06:36 — 5 keywords, 0 threats, 3 screenshots"
- Clicking expands to show individual keyword results
- Threat runs expand by default, clear runs are collapsed
- Screenshot thumbnails are 100x64px (up from 64x40px)
- Filter still works but operates on runs, not individual checks

```typescript
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
      {/* Run summary header */}
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
          hasThreat
            ? 'bg-red-500/10 text-red-500'
            : 'bg-emerald-500/10 text-emerald-500'
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

        {/* Mini screenshot previews when collapsed */}
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

      {/* Expanded: individual check results */}
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
```

- [ ] **Step 2: Build to verify**

Run: `cd "/Users/chris/Claude Code/serpalert" && npm run build 2>&1 | tail -5`
Expected: Build passes

---

### Task 4: Merge metric cards into status hero

**Files:**
- Modify: `src/components/status-hero.tsx`
- Modify: `src/app/dashboard/[brandId]/page.tsx`

- [ ] **Step 1: Update status-hero.tsx to include metrics**

Add metrics props and render them inline in the hero banner:

```typescript
import { ManualCheckButton } from '@/components/manual-check-button'

interface StatusHeroProps {
  brandId: string
  threatsToday: number
  lastCheckAt: string | null
  isAdmin?: boolean
  showCheckButton?: boolean
  checksToday?: number
  keywordCount?: number
  last7DaysThreats?: number[]
}

function getRelativeTime(date: string | null): string {
  if (!date) return 'No checks yet'
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Last check just now'
  if (diffMin < 60) return `Last check ${diffMin} min ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `Last check ${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `Last check ${diffDays}d ago`
}

const BLOCKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
function buildSparkline(data: number[]): string {
  const padded = data.length < 7 ? [...Array(7 - data.length).fill(0), ...data] : data.slice(-7)
  const max = Math.max(...padded)
  if (max === 0) return '▁▁▁▁▁▁▁'
  return padded.map(v => BLOCKS[Math.min(Math.round((v / max) * 7), 7)]).join('')
}

export function StatusHero({
  brandId, threatsToday, lastCheckAt, isAdmin, showCheckButton = true,
  checksToday = 0, keywordCount = 0, last7DaysThreats = [],
}: StatusHeroProps) {
  const isProtected = threatsToday === 0
  const relativeTime = getRelativeTime(lastCheckAt)
  const sparkline = buildSparkline(last7DaysThreats)

  return (
    <div className={`rounded-xl overflow-hidden ${
      isProtected
        ? 'bg-emerald-500/10 border border-emerald-500/30'
        : 'bg-red-500/10 border border-red-500/30'
    }`}>
      {/* Top row: status + action */}
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
            isProtected ? 'bg-emerald-500/20' : 'bg-red-500/20'
          }`}>
            {isProtected ? '🛡' : '⚠'}
          </div>
          <div>
            <p className={`text-lg font-bold ${isProtected ? 'text-emerald-500' : 'text-red-500'}`}>
              {isProtected
                ? 'BRAND PROTECTED'
                : `${threatsToday} THREAT${threatsToday !== 1 ? 'S' : ''} DETECTED`}
            </p>
            <p className="text-xs text-muted-foreground">
              {isProtected
                ? `No competitors detected in last 24h · ${relativeTime}`
                : `${threatsToday} competitor${threatsToday !== 1 ? 's' : ''} bidding on your brand · ${relativeTime}`}
            </p>
          </div>
        </div>
        {showCheckButton && <ManualCheckButton brandId={brandId} />}
      </div>

      {/* Bottom row: inline metrics */}
      {(checksToday > 0 || keywordCount > 0) && (
        <div className="border-t border-border/30 px-4 py-2.5 flex items-center gap-6 text-xs">
          <div>
            <span className="text-muted-foreground">Checks today</span>
            <span className="ml-1.5 font-mono font-bold text-foreground">{checksToday}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Keywords</span>
            <span className="ml-1.5 font-mono font-bold text-foreground">{keywordCount}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Threats today</span>
            <span className={`ml-1.5 font-mono font-bold ${threatsToday > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {threatsToday}
            </span>
          </div>
          {last7DaysThreats.length > 0 && (
            <div>
              <span className="text-muted-foreground">7d trend</span>
              <span className="ml-1.5 font-mono text-foreground">{sparkline}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update brand overview page to remove MetricCards and pass metrics to StatusHero**

In `src/app/dashboard/[brandId]/page.tsx`, remove the `MetricCards` import and component usage. Pass the metrics to `StatusHero` instead:

Replace the return block:

```typescript
  return (
    <div className="space-y-4 max-w-5xl">
      <StatusHero
        brandId={brandId}
        threatsToday={threatsToday}
        lastCheckAt={lastCheckAt}
        isAdmin={isAdmin}
        checksToday={checksToday.length}
        keywordCount={brand.keywords.length}
        last7DaysThreats={last7Days}
      />
      <DashboardTabs brandId={brandId} hasGoogleAds={!!brand.googleAdsCustomerId} />
      <ActivityFeed checks={checksWithAds} brandId={brandId} brandToken={brand.clientToken} />
    </div>
  )
```

Remove the `MetricCards` import line. The `metric-cards.tsx` file can be kept for now (the client view may still use `ClientMetricCards`).

- [ ] **Step 3: Build to verify**

Run: `cd "/Users/chris/Claude Code/serpalert" && npm run build 2>&1 | tail -5`
Expected: Build passes

---

### Task 5: Improve dashboard brand list

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Rewrite dashboard/page.tsx**

Key changes:
- Add summary bar at top ("3 brands · 13 keywords · 0 active threats")
- Add last check time to each card
- Add 7-day threat count
- Make entire card clickable (wrap in Link)
- Replace hardcoded oklch status dots with Tailwind classes

Read the current file first, then apply these changes to the brand cards section. Add `getThreatCountLast7Days` import from queries. Compute threat counts alongside last checks.

In the brand card, replace the existing content with:

```tsx
<Link
  key={b.id}
  href={`/dashboard/${b.id}`}
  className="bg-card border border-border rounded-lg p-5 tech-card-hover block"
>
  <div className="space-y-3">
    <div>
      <h3 className="font-semibold text-lg">{b.name}</h3>
      <p className="font-mono text-sm text-muted-foreground">
        {b.domain || 'No domain set'}
      </p>
    </div>

    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono uppercase tracking-wider ${planClass}`}>
        {b.plan ?? 'free'}
      </span>
      <span className="text-xs text-muted-foreground">
        {b.keywords.length} keyword{b.keywords.length !== 1 ? 's' : ''}
      </span>
    </div>

    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-1.5">
        <span className={`inline-block w-2 h-2 rounded-full ${hasThreat ? 'bg-red-500' : 'bg-emerald-500'}`} />
        <span className="text-muted-foreground">
          {hasThreat
            ? `${lastCheck.competitorCount} competitor${lastCheck.competitorCount !== 1 ? 's' : ''}`
            : 'Protected'}
        </span>
      </div>
      {lastCheck && (
        <span className="text-muted-foreground font-mono">
          {formatRelativeTime(new Date(lastCheck.checkedAt))}
        </span>
      )}
    </div>
  </div>
</Link>
```

Add a `formatRelativeTime` helper at the top of the file (same pattern as other pages).

Add a summary bar before the brand grid:

```tsx
<div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-4 text-sm">
  <span className="text-muted-foreground">
    <span className="font-mono font-bold text-foreground">{brands.length}</span> brand{brands.length !== 1 ? 's' : ''}
  </span>
  <span className="text-border">·</span>
  <span className="text-muted-foreground">
    <span className="font-mono font-bold text-foreground">{totalKeywords}</span> keywords
  </span>
  <span className="text-border">·</span>
  <span className="text-muted-foreground">
    <span className={`font-mono font-bold ${totalThreats > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{totalThreats}</span> active threats
  </span>
</div>
```

Remove the separate "Open Dashboard" button since the whole card is now a link. Remove the hardcoded `oklch` inline styles for the status dot.

- [ ] **Step 2: Build to verify**

Run: `cd "/Users/chris/Claude Code/serpalert" && npm run build 2>&1 | tail -5`
Expected: Build passes

---

### Task 6: Group screenshots by date

**Files:**
- Modify: `src/app/dashboard/[brandId]/screenshots/page.tsx`

- [ ] **Step 1: Update screenshots page with date grouping**

Group screenshots by date (using `toDateString()`) and render date headers. Keep the 2-column grid within each date group.

Replace the screenshots grid section with:

```tsx
{(() => {
  // Group by date
  const groups = new Map<string, typeof screenshots>()
  for (const s of screenshots) {
    const dateKey = new Date(s.checkedAt).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    if (!groups.has(dateKey)) groups.set(dateKey, [])
    groups.get(dateKey)!.push(s)
  }

  return [...groups.entries()].map(([date, items]) => (
    <div key={date} className="space-y-3">
      <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{date}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(check => (
          /* existing screenshot card JSX — keep as-is */
        ))}
      </div>
    </div>
  ))
})()}
```

Keep the existing screenshot card JSX unchanged — just wrap it in the date grouping structure.

- [ ] **Step 2: Build to verify**

Run: `cd "/Users/chris/Claude Code/serpalert" && npm run build 2>&1 | tail -5`
Expected: Build passes

---

### Task 7: Add sidebar notification badge + last check time

**Files:**
- Modify: `src/components/sidebar.tsx`
- Modify: `src/app/dashboard/[brandId]/layout.tsx`

- [ ] **Step 1: Add `unresolvedCount` and `lastCheckAt` props to sidebar**

Update the `SidebarProps` interface:

```typescript
interface SidebarProps {
  brandId: string
  brandName: string
  brands: { id: string; name: string }[]
  plan: string
  keywordCount: number
  keywordLimit: number
  isAdmin: boolean
  unresolvedCount?: number
  lastCheckAt?: string | null
}
```

In the nav items rendering, add a badge on "Competitors" when `unresolvedCount > 0`:

```tsx
<span className="lg:inline md:hidden">{item.label}</span>
{item.path === '/competitors' && unresolvedCount > 0 && (
  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
    {unresolvedCount}
  </span>
)}
```

Below the brand switcher, add last check time:

```tsx
{lastCheckAt && (
  <p className="px-4 text-[10px] text-muted-foreground font-mono lg:block md:hidden">
    Last scan {getRelativeTime(lastCheckAt)}
  </p>
)}
```

Add a simple `getRelativeTime` helper at the top of the file.

- [ ] **Step 2: Update layout.tsx to pass new props**

In `src/app/dashboard/[brandId]/layout.tsx`, import `getUnresolvedThreatCount` and `getLastCheckForBrand` from queries. Fetch the data and pass to Sidebar:

```typescript
import { getUnresolvedThreatCount, getLastCheckForBrand } from '@/lib/db/queries'

// Inside the layout function, after getting the brand:
const [unresolvedCount, lastCheck] = await Promise.all([
  getUnresolvedThreatCount(brandId),
  getLastCheckForBrand(brandId),
])

// In the Sidebar component:
<Sidebar
  ...existing props...
  unresolvedCount={unresolvedCount}
  lastCheckAt={lastCheck ? new Date(lastCheck.checkedAt).toISOString() : null}
/>
```

- [ ] **Step 3: Build to verify**

Run: `cd "/Users/chris/Claude Code/serpalert" && npm run build 2>&1 | tail -5`
Expected: Build passes

---

### Task 8: Improve admin page

**Files:**
- Modify: `src/app/admin/brands/page.tsx`

- [ ] **Step 1: Add last check column and summary stats**

In the admin page, the `checkMap` already contains the last check for each brand. Add a "Last Check" column to the table showing relative time. Also add a summary stats row at the top showing total keywords and total checks today.

In the stats section (after "Total Brands"), add:

```tsx
<div className="bg-card border border-border rounded-lg p-4 inline-block">
  <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-1">Total Keywords</p>
  <p className="text-3xl font-black text-gradient-tech">
    {brands.reduce((sum, b) => sum + b.keywords.length, 0)}
  </p>
</div>
```

Add a "Last Check" column header and cell:

```tsx
// Header
<th className="px-4 py-3 font-medium">Last Check</th>

// Cell
<td className="px-4 py-3 text-xs font-mono text-muted-foreground">
  {lastCheck ? formatRelativeTime(new Date(lastCheck.checkedAt)) : 'Never'}
</td>
```

Add `formatRelativeTime` helper at top of file.

Wrap the stats in a flex row:

```tsx
<div className="flex items-center gap-4">
  {/* Total Brands card */}
  {/* Total Keywords card */}
</div>
```

- [ ] **Step 2: Build to verify**

Run: `cd "/Users/chris/Claude Code/serpalert" && npm run build 2>&1 | tail -5`
Expected: Build passes

---

### Task 9: Final build and local verification

- [ ] **Step 1: Full build**

Run: `cd "/Users/chris/Claude Code/serpalert" && npm run build 2>&1 | tail -20`
Expected: All routes compile, zero errors

- [ ] **Step 2: Check for remaining hardcoded oklch in modified files**

Run: `cd "/Users/chris/Claude Code/serpalert" && grep -r "oklch" src/components/activity-feed.tsx src/components/status-hero.tsx src/app/dashboard/page.tsx`
Expected: No matches (all oklch should be in globals.css only)

- [ ] **Step 3: Stage and commit**

```bash
cd "/Users/chris/Claude Code/serpalert"
git add -A
git status
git commit -m "UX overhaul: grouped scans, merged metrics, brand health, sidebar badges

- Group activity feed by scan run (collapse 5 keyword rows into 1 expandable card)
- Merge metric cards into status hero banner (less vertical space)
- Dashboard list: add last check time, threat count, summary bar, clickable cards
- Screenshots page: group by date with headers
- Sidebar: unresolved threat badge on Competitors, last scan time
- Admin: total keywords stat, last check column
- Larger screenshot thumbnails (100x64px)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4: Push and deploy**

```bash
git push origin main
vercel --prod
```
