import { notFound } from 'next/navigation'
import { getBrandByToken, getRecentSerpChecks, getCompetitorAdsForChecks, getCompetitorSummaryForBrand } from '@/lib/db/queries'
import { ScreenshotModal } from '@/components/screenshot-modal'
import { StatusHero } from '@/components/status-hero'
import { ClientMetricCards } from '@/components/client-metric-cards'
import { Badge } from '@/components/ui/badge'
import type { CompetitorAd, SerpCheck } from '@/lib/db/schema'

type CheckWithAds = SerpCheck & { ads: CompetitorAd[] }

function toUTCDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function getDailyStats(checks: CheckWithAds[], days: number) {
  const stats: { date: string; checks: number; threats: number }[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = toUTCDate(d)
    const dayChecks = checks.filter(c => toUTCDate(new Date(c.checkedAt)) === dateStr)
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
  const todayStr = toUTCDate(new Date())
  const todayChecks = checksWithAds.filter(c => toUTCDate(new Date(c.checkedAt)) === todayStr)
  const competitorsToday = new Set(todayChecks.flatMap(c => c.ads.map(a => a.domain))).size
  const totalChecks = checks.length
  const competitorStats = await getCompetitorSummaryForBrand(brand.id)
  const last7Days = getDailyStats(checksWithAds, 7)

  // Recent threats only (checks with competitors)
  const recentThreats = checksWithAds.filter(c => c.competitorCount > 0).slice(0, 10)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* 1. Header with context */}
        <header className="text-center space-y-1">
          <p className="text-xs uppercase tracking-[2px] text-muted-foreground">
            Brand Protection Report &middot; {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-3xl font-extrabold text-gradient-tech">{brand.name}</h1>
          <p className="text-sm text-muted-foreground">
            Monitoring {brand.keywords.length} branded search{brand.keywords.length !== 1 ? 'es' : ''} for competitor ads
          </p>
        </header>

        {/* 2. Status Hero */}
        <StatusHero
          brandId={brand.id}
          threatsToday={competitorsToday}
          lastCheckAt={lastCheck?.checkedAt ? new Date(lastCheck.checkedAt).toISOString() : null}
          showCheckButton={false}
        />

        {/* 3. Executive Summary */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-[11px] uppercase tracking-[1.5px] font-mono text-foreground/70 mb-3 flex items-center gap-2">
            <span className="w-0.5 h-3 bg-primary rounded-full inline-block" />
            Summary
          </h2>
          <p className="text-sm text-foreground leading-relaxed">
            {competitorStats.length === 0 ? (
              `Over the past 7 days, we ran ${last7Days.reduce((s, d) => s + d.checks, 0)} scans across your ${brand.keywords.length} monitored keywords. No competitor ads were found — your brand search results are clear.`
            ) : (
              `Over the past 7 days, we ran ${last7Days.reduce((s, d) => s + d.checks, 0)} scans across your ${brand.keywords.length} monitored keywords. ${competitorStats.length} competitor${competitorStats.length !== 1 ? 's were' : ' was'} found advertising on your brand name. The most active was ${competitorStats[0].domain}, spotted ${competitorStats[0].recentCount || competitorStats[0].totalCount} time${(competitorStats[0].recentCount || competitorStats[0].totalCount) !== 1 ? 's' : ''}.`
            )}
          </p>
        </div>

        {/* 4. Competitor Ads Found — threats only */}
        {recentThreats.length > 0 && (
          <section className="bg-card border border-border rounded-lg overflow-hidden">
            <h2 className="text-[11px] uppercase tracking-[1.5px] font-mono text-foreground/70 px-6 pt-6 mb-4 flex items-center gap-2">
              <span className="w-0.5 h-3 bg-destructive rounded-full inline-block" />
              Competitor Ads Found
            </h2>
            <div className="divide-y divide-border">
              {recentThreats.map(check => (
                <div key={check.id} className="px-6 py-4 border-l-4 border-l-destructive bg-destructive/[0.03]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">
                      {new Date(check.checkedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {' '}
                      {new Date(check.checkedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-sm font-medium">{check.keyword}</span>
                    <Badge variant="destructive" className="text-xs">
                      {check.competitorCount} competitor{check.competitorCount !== 1 ? 's' : ''}
                    </Badge>
                    {check.screenshotUrl && (
                      <div className="ml-auto">
                        <ScreenshotModal screenshotUrl={check.screenshotUrl} keyword={check.keyword} />
                      </div>
                    )}
                  </div>
                  {check.ads.map(ad => (
                    <div key={ad.id} className="ml-4 mt-2 rounded border border-border p-3 bg-card text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-medium text-foreground">{ad.domain}</span>
                        {ad.position != null && (
                          <span className="ml-auto font-mono text-amber-500">Ad position {ad.position}</span>
                        )}
                      </div>
                      {ad.headline && <p className="text-primary font-semibold text-sm">{ad.headline}</p>}
                      {ad.description && <p className="text-muted-foreground mt-1">{ad.description}</p>}
                      {ad.displayUrl && <p className="font-mono text-[11px] text-muted-foreground mt-1">{ad.displayUrl}</p>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Metric Cards */}
        <ClientMetricCards
          keywordCount={brand.keywords.length}
          totalChecks={totalChecks}
          todayThreats={competitorsToday}
          allTimeCompetitors={competitorStats.length}
        />

        {/* 6. Competitor Domains Table */}
        {competitorStats.length > 0 && (
          <section className="bg-card border border-border rounded-lg overflow-hidden">
            <h2 className="text-[11px] uppercase tracking-[1.5px] font-mono font-semibold text-foreground/80 px-6 pt-6 mb-4 flex items-center gap-2">
              <span className="w-0.5 h-3 bg-primary rounded-full inline-block" />
              Competitor Advertisers
            </h2>
            <p className="text-xs text-muted-foreground px-6 mb-4">
              These advertisers have been found running paid ads targeting your brand name.
            </p>
            {/* Desktop table */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-[1.2fr_60px_60px_1.5fr_80px] gap-4 px-6 py-2 border-b border-border bg-muted/30 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                <span>Domain</span>
                <span className="text-right">Last 30d</span>
                <span className="text-right">Avg Pos</span>
                <span>Keywords Targeted</span>
                <span className="text-right">Last Seen</span>
              </div>
              <div className="divide-y divide-border">
                {competitorStats.map(comp => (
                  <div key={comp.domain} className="grid grid-cols-[1.2fr_60px_60px_1.5fr_80px] gap-4 px-6 py-3 items-center">
                    <span className="font-mono text-sm font-medium">{comp.domain}</span>
                    <span className="font-mono text-sm text-right tabular-nums">{comp.recentCount}</span>
                    <span className="font-mono text-sm text-right tabular-nums">
                      {comp.avgPosition != null ? comp.avgPosition : '\u2014'}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {comp.keywords.slice(0, 3).map(kw => (
                        <span key={kw} className="text-[10px] rounded px-1.5 py-0.5 font-mono bg-violet-500/15 text-violet-600 dark:text-violet-400">
                          {kw}
                        </span>
                      ))}
                      {comp.keywords.length > 3 && (
                        <span className="text-[10px] font-mono text-muted-foreground">+{comp.keywords.length - 3}</span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground text-right whitespace-nowrap">
                      {new Date(comp.lastSeen).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-border">
              {competitorStats.map(comp => (
                <div key={comp.domain} className="px-6 py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-medium">{comp.domain}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {new Date(comp.lastSeen).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{comp.recentCount} times in 30d</span>
                    {comp.avgPosition != null && <span>Avg pos {comp.avgPosition}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. 7-Day Activity Chart */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-[11px] uppercase tracking-[1.5px] font-mono text-foreground/70 mb-1 flex items-center gap-2">
            <span className="w-0.5 h-3 bg-primary rounded-full inline-block" />
            This Week
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Each day we scan Google for competitors advertising on your brand name.
          </p>
          <div className="flex items-end gap-3" style={{ height: 200 }}>
            {last7Days.map((day, i) => {
              const maxChecks = Math.max(...last7Days.map(d => d.checks), 1)
              const barHeight = day.checks > 0 ? Math.max((day.checks / maxChecks) * 160, 8) : 4
              const hasThreats = day.threats > 0
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1" style={{ height: '100%' }}>
                  <div className="flex flex-col items-center justify-end flex-1">
                    {hasThreats && (
                      <span className="text-[10px] font-mono mb-0.5 text-destructive">
                        {day.threats}
                      </span>
                    )}
                    <div
                      className={`w-full rounded-sm ${hasThreats ? 'bg-destructive/70' : 'bg-primary/30'}`}
                      style={{ height: barHeight }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{day.date}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-[10px] text-muted-foreground font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-primary/30" /> No competitor ads found
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-destructive/70" /> Competitor ads detected
            </span>
          </div>
        </section>

        {/* 8. Stale data warning */}
        {(!lastCheck || (Date.now() - new Date(lastCheck.checkedAt).getTime()) > 48 * 60 * 60 * 1000) && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm text-amber-600 dark:text-amber-400">
            Monitoring may be paused — the last scan was more than 48 hours ago. Contact your account manager if this persists.
          </div>
        )}

        {/* 9. Footer */}
        <footer className="text-center pt-4 pb-8 border-t border-border space-y-1">
          <p className="text-xs text-muted-foreground font-mono">
            Last scan: {getRelativeTime(lastCheck?.checkedAt ?? null)}
            {' '}&middot;{' '}
            Monitoring {brand.keywords.length} keyword{brand.keywords.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-muted-foreground">
            Report generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </footer>

      </div>
    </div>
  )
}
