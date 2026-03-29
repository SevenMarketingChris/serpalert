import { notFound } from 'next/navigation'
import { getBrandByToken, getRecentSerpChecks, getCompetitorAdsForChecks } from '@/lib/db/queries'
import { ScreenshotModal } from '@/components/screenshot-modal'
import { ThemeToggle } from '@/components/theme-toggle'
import { StatusHero } from '@/components/status-hero'
import { ClientMetricCards } from '@/components/client-metric-cards'
import { Badge } from '@/components/ui/badge'
import type { CompetitorAd, SerpCheck } from '@/lib/db/schema'

type CheckWithAds = SerpCheck & { ads: CompetitorAd[] }

function getCompetitorStats(checks: CheckWithAds[]) {
  const domainMap = new Map<string, { appearances: number; keywords: Set<string>; firstSeen: Date; lastSeen: Date }>()
  for (const check of checks) {
    for (const ad of check.ads) {
      const existing = domainMap.get(ad.domain)
      const checkDate = new Date(check.checkedAt)
      if (existing) {
        existing.appearances++
        existing.keywords.add(check.keyword)
        if (checkDate < existing.firstSeen) existing.firstSeen = checkDate
        if (checkDate > existing.lastSeen) existing.lastSeen = checkDate
      } else {
        domainMap.set(ad.domain, {
          appearances: 1,
          keywords: new Set([check.keyword]),
          firstSeen: checkDate,
          lastSeen: checkDate,
        })
      }
    }
  }
  return [...domainMap.entries()]
    .map(([domain, stats]) => ({
      domain,
      appearances: stats.appearances,
      keywords: [...stats.keywords],
      firstSeen: stats.firstSeen,
      lastSeen: stats.lastSeen,
    }))
    .sort((a, b) => b.appearances - a.appearances)
}

function getDailyStats(checks: CheckWithAds[], days: number) {
  const stats: { date: string; checks: number; threats: number }[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toDateString()
    const dayChecks = checks.filter(c => new Date(c.checkedAt).toDateString() === dateStr)
    const dayThreats = dayChecks.filter(c => c.competitorCount > 0).length
    stats.push({
      date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      checks: dayChecks.length,
      threats: dayThreats,
    })
  }
  return stats
}

function getRelativeTime(date: Date | null): string {
  if (!date) return 'Never'
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export default async function ClientPortal({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const brand = await getBrandByToken(token)
  if (!brand) notFound()

  const checks = await getRecentSerpChecks(brand.id, 500)
  const allAds = await getCompetitorAdsForChecks(checks.map(c => c.id))
  const adsByCheckId = allAds.reduce<Record<string, CompetitorAd[]>>((acc, ad) => {
    if (!acc[ad.serpCheckId]) acc[ad.serpCheckId] = []
    acc[ad.serpCheckId].push(ad)
    return acc
  }, {})
  const checksWithAds = checks.map(c => ({ ...c, ads: adsByCheckId[c.id] ?? [] }))

  const lastCheck = checks[0] ?? null
  const todayStr = new Date().toDateString()
  const todayChecks = checksWithAds.filter(c => new Date(c.checkedAt).toDateString() === todayStr)
  const competitorsToday = new Set(todayChecks.flatMap(c => c.ads.map(a => a.domain))).size
  const totalChecks = checks.length
  const allTimeCompetitors = new Set(allAds.map(a => a.domain)).size
  const competitorStats = getCompetitorStats(checksWithAds)
  const last7Days = getDailyStats(checksWithAds, 7)

  // Recent detections: last 20 checks (both clear and threat)
  const recentChecks = checksWithAds.slice(0, 20)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* 1. Header */}
        <header className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-xs uppercase tracking-[2px] text-muted-foreground">
              Brand Protection Report
            </p>
            <h1 className="text-3xl font-extrabold text-gradient-tech">{brand.name}</h1>
          </div>
          <div className="flex-shrink-0">
            <ThemeToggle />
          </div>
        </header>

        {/* 2. Status Hero */}
        <StatusHero
          brandId={brand.id}
          threatsToday={competitorsToday}
          lastCheckAt={lastCheck?.checkedAt ? new Date(lastCheck.checkedAt).toISOString() : null}
          showCheckButton={false}
        />

        {/* 3. Metric Cards */}
        <ClientMetricCards
          keywordCount={brand.keywords.length}
          totalChecks={totalChecks}
          todayThreats={competitorsToday}
          allTimeCompetitors={allTimeCompetitors}
        />

        {/* 4. 7-Day Activity Chart */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xs uppercase tracking-[1.5px] font-mono text-muted-foreground mb-4">
            7-Day Activity
          </h2>
          <div className="flex items-end gap-2" style={{ height: 160 }}>
            {last7Days.map((day, i) => {
              const maxChecks = Math.max(...last7Days.map(d => d.checks), 1)
              const barHeight = day.checks > 0 ? Math.max((day.checks / maxChecks) * 120, 8) : 4
              const hasThreats = day.threats > 0
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1" style={{ height: '100%' }}>
                  <div className="flex flex-col items-center justify-end flex-1">
                    {hasThreats && (
                      <span className="text-[10px] font-mono mb-0.5" style={{ color: 'oklch(52% 0.22 15)' }}>
                        {day.threats}
                      </span>
                    )}
                    <div
                      className="w-full max-w-10 rounded-sm"
                      style={{
                        height: barHeight,
                        background: hasThreats
                          ? 'oklch(52% 0.22 15 / 0.7)'
                          : 'oklch(62% 0.22 250 / 0.3)',
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{day.date}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-[10px] text-muted-foreground font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ background: 'oklch(62% 0.22 250 / 0.3)' }} /> Clear
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ background: 'oklch(52% 0.22 15 / 0.7)' }} /> Threats
            </span>
          </div>
        </section>

        {/* 5. Competitor Domains Table */}
        {competitorStats.length > 0 && (
          <section className="bg-card border border-border rounded-lg overflow-hidden">
            <h2 className="text-xs uppercase tracking-[1.5px] font-mono text-muted-foreground px-6 pt-6 mb-4">
              Competitor Domains
            </h2>

            {/* Desktop table */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-4 px-6 py-2 border-b border-border bg-muted/30 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                <span>Domain</span>
                <span className="text-right">Detections</span>
                <span>Keywords</span>
                <span className="text-right">Last Seen</span>
              </div>
              <div className="divide-y divide-border">
                {competitorStats.map(comp => (
                  <div key={comp.domain} className="grid grid-cols-[1fr_auto_1fr_auto] gap-4 px-6 py-3 items-center">
                    <span className="font-mono text-sm font-medium">{comp.domain}</span>
                    <span className="font-mono text-sm text-right tabular-nums">{comp.appearances}</span>
                    <div className="flex flex-wrap gap-1">
                      {comp.keywords.map(kw => (
                        <span
                          key={kw}
                          className="text-[10px] rounded px-1.5 py-0.5 font-mono"
                          style={{
                            background: 'oklch(40% 0.15 300 / 0.15)',
                            color: 'oklch(70% 0.15 300)',
                          }}
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground text-right whitespace-nowrap">
                      {comp.lastSeen.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile stacked cards */}
            <div className="sm:hidden divide-y divide-border">
              {competitorStats.map(comp => (
                <div key={comp.domain} className="px-6 py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-medium">{comp.domain}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {comp.lastSeen.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {comp.keywords.map(kw => (
                        <span
                          key={kw}
                          className="text-[10px] rounded px-1.5 py-0.5 font-mono"
                          style={{
                            background: 'oklch(40% 0.15 300 / 0.15)',
                            color: 'oklch(70% 0.15 300)',
                          }}
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                    <span className="font-mono text-xs tabular-nums">{comp.appearances} detections</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Recent Detections */}
        <section className="bg-card border border-border rounded-lg overflow-hidden">
          <h2 className="text-xs uppercase tracking-[1.5px] font-mono text-muted-foreground px-6 pt-6 mb-4">
            Recent Detections
          </h2>

          {recentChecks.length === 0 ? (
            <div className="px-6 pb-6 text-center">
              <p className="text-sm text-muted-foreground">
                Monitoring is active. Results will appear after the first scheduled check.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentChecks.map(check => {
                const hasThreat = check.competitorCount > 0
                return (
                  <div
                    key={check.id}
                    className={`px-6 py-4 ${hasThreat ? 'border-l-2 border-l-destructive/50' : ''}`}
                  >
                    {/* Check header */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">
                        {new Date(check.checkedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        {' '}
                        {new Date(check.checkedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-sm font-medium">{check.keyword}</span>
                      {hasThreat ? (
                        <Badge variant="destructive" className="text-xs">
                          {check.competitorCount} competitor{check.competitorCount !== 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-emerald-500/15 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15">
                          CLEAR
                        </Badge>
                      )}
                      {check.screenshotUrl && (
                        <div className="ml-auto">
                          <ScreenshotModal screenshotUrl={check.screenshotUrl} keyword={check.keyword} />
                        </div>
                      )}
                    </div>

                    {/* Ad copy for threats */}
                    {hasThreat && check.ads.map(ad => (
                      <div key={ad.id} className="ml-4 mt-2 rounded border border-border p-3 bg-muted/20 text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <span className="font-mono font-medium text-foreground">{ad.domain}</span>
                          {ad.position != null && (
                            <span className="ml-auto font-mono text-tech-orange">Position {ad.position}</span>
                          )}
                        </div>
                        {ad.headline && (
                          <p className="text-primary font-semibold text-sm leading-snug">{ad.headline}</p>
                        )}
                        {ad.description && (
                          <p className="text-foreground/60 mt-1 leading-relaxed">{ad.description}</p>
                        )}
                        {ad.displayUrl && (
                          <p className="font-mono text-[11px] text-muted-foreground mt-1">{ad.displayUrl}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* 7. Footer */}
        <footer className="text-center pt-4 pb-8 border-t border-border space-y-1">
          <p className="text-xs text-muted-foreground font-mono">
            Last check: {getRelativeTime(lastCheck?.checkedAt ?? null)}
            {' '}&middot;{' '}
            Monitoring {brand.keywords.length} keyword{brand.keywords.length !== 1 ? 's' : ''}
            {' '}&middot;{' '}
            3 checks per day
          </p>
          <p className="text-xs text-muted-foreground">
            Brand monitoring report · Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </footer>

      </div>
    </div>
  )
}
