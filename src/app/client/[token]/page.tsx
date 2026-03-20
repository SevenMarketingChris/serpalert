import { notFound } from 'next/navigation'
import { getBrandByToken, getRecentSerpChecks, getCompetitorAdsForChecks } from '@/lib/db/queries'
import { ScreenshotModal } from '@/components/screenshot-modal'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
  const stats: { date: string; checks: number; competitors: number }[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toDateString()
    const dayChecks = checks.filter(c => new Date(c.checkedAt).toDateString() === dateStr)
    const dayCompetitors = new Set(dayChecks.flatMap(c => c.ads.map(a => a.domain))).size
    stats.push({
      date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      checks: dayChecks.length,
      competitors: dayCompetitors,
    })
  }
  return stats
}

export default async function ClientPage({ params }: { params: Promise<{ token: string }> }) {
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

  const lastCheck = checks[0]
  const todayStr = new Date().toDateString()
  const todayChecks = checksWithAds.filter(c => new Date(c.checkedAt).toDateString() === todayStr)
  const competitorsToday = new Set(todayChecks.flatMap(c => c.ads.map(a => a.domain))).size
  const totalChecks = checks.length
  const allTimeCompetitors = new Set(allAds.map(a => a.domain)).size
  const checksWithCompetitors = checksWithAds.filter(c => c.competitorCount > 0)
  const competitorStats = getCompetitorStats(checksWithAds)
  const last7Days = getDailyStats(checksWithAds, 7)
  const recentAlerts = checksWithAds.filter(c => c.competitorCount > 0).slice(0, 20)

  // Executive summary
  const competitorsThisWeek = new Set(
    checksWithAds
      .filter(c => {
        const d = new Date(c.checkedAt)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return d >= weekAgo
      })
      .flatMap(c => c.ads.map(a => a.domain))
  ).size

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-5">
        <div className="container mx-auto max-w-3xl flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-1">Brand Protection Report</p>
            <h1 className="text-2xl font-bold text-gradient-tech">{brand.name}</h1>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-3xl space-y-10">

        {/* Section 1: Executive Summary */}
        <section>
          <Card className={competitorsToday > 0 ? 'border-l-4 border-l-destructive' : 'border-l-4 border-l-green-500'}>
            <CardContent className="p-5">
              {competitorsToday === 0 && checksWithCompetitors.length === 0 ? (
                <p className="text-sm leading-relaxed">
                  No competitor ads have been detected bidding on your brand keywords.
                  We&apos;re monitoring <strong>{brand.keywords.length} keyword{brand.keywords.length !== 1 ? 's' : ''}</strong> with
                  checks running 3 times daily.
                  {lastCheck && <> Last checked {new Date(lastCheck.checkedAt).toLocaleString('en-GB')}.</>}
                </p>
              ) : competitorsToday === 0 ? (
                <p className="text-sm leading-relaxed">
                  <strong className="text-tech-green">All clear today.</strong> No competitor ads detected
                  across {todayChecks.length} checks.
                  {competitorsThisWeek > 0
                    ? <> However, <strong>{competitorsThisWeek} competitor domain{competitorsThisWeek > 1 ? 's were' : ' was'}</strong> detected in the past 7 days.</>
                    : <> No competitors detected this week either.</>
                  }
                  {' '}We&apos;re monitoring <strong>{brand.keywords.length} keyword{brand.keywords.length !== 1 ? 's' : ''}</strong>.
                </p>
              ) : (
                <p className="text-sm leading-relaxed">
                  <strong className="text-destructive">{competitorsToday} competitor domain{competitorsToday > 1 ? 's' : ''} detected today</strong> bidding
                  on your brand keywords. {competitorStats.length > 0 && (
                    <>The most active is <strong>{competitorStats[0].domain}</strong> ({competitorStats[0].appearances} appearances). </>
                  )}
                  We&apos;re monitoring <strong>{brand.keywords.length} keyword{brand.keywords.length !== 1 ? 's' : ''}</strong> with
                  checks running 3 times daily.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Section 2: Key Metrics */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-mono mb-4">Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Keywords</p>
              <p className="font-mono text-xl font-bold">{brand.keywords.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Checks</p>
              <p className="font-mono text-xl font-bold">{totalChecks}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Today</p>
              <p className={`font-mono text-xl font-bold ${competitorsToday === 0 ? 'text-tech-green' : 'text-destructive'}`}>
                {competitorsToday === 0 ? 'Clear' : `${competitorsToday} found`}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">All-Time Competitors</p>
              <p className="font-mono text-xl font-bold">{allTimeCompetitors}</p>
            </div>
          </div>
        </section>

        {/* Section 3: 7-Day Activity */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-mono mb-4">Last 7 Days</h2>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-end gap-1 h-20">
                {last7Days.map((day, i) => {
                  const maxChecks = Math.max(...last7Days.map(d => d.checks), 1)
                  const height = day.checks > 0 ? Math.max((day.checks / maxChecks) * 100, 8) : 4
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col items-center justify-end h-16">
                        {day.competitors > 0 && (
                          <span className="text-[10px] font-mono text-destructive mb-0.5">{day.competitors}</span>
                        )}
                        <div
                          className={`w-full max-w-8 rounded-sm transition-all ${day.competitors > 0 ? 'bg-destructive/70' : 'bg-primary/30'}`}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">{day.date}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-[10px] text-muted-foreground font-mono">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary/30" /> Checks (clear)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-destructive/70" /> Competitors detected</span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 4: Competitor Domains */}
        {competitorStats.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-mono mb-4">Competitor Domains</h2>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 border-b border-border bg-muted/30 text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  <span>Domain</span>
                  <span className="text-right">Detections</span>
                  <span className="text-right hidden sm:block">Last Seen</span>
                </div>
                {/* Table rows */}
                <div className="divide-y divide-border">
                  {competitorStats.map(comp => (
                    <div key={comp.domain} className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 items-start">
                      <div>
                        <span className="font-mono text-sm font-medium block">{comp.domain}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {comp.keywords.map(kw => (
                            <span key={kw} className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="font-mono text-sm text-right tabular-nums">{comp.appearances}</span>
                      <span className="font-mono text-xs text-muted-foreground text-right hidden sm:block whitespace-nowrap">
                        {comp.lastSeen.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Section 5: Recent Detections */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-mono mb-4">
            {recentAlerts.length > 0 ? 'Recent Detections' : 'Recent Activity'}
          </h2>

          {checks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground">Monitoring is active. Results will appear after the first scheduled check.</p>
              </CardContent>
            </Card>
          ) : recentAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-tech-green font-medium mb-1">No competitor ads detected</p>
                <p className="text-xs text-muted-foreground">
                  {totalChecks} check{totalChecks !== 1 ? 's' : ''} completed across {brand.keywords.length} keyword{brand.keywords.length !== 1 ? 's' : ''} — all clear.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {recentAlerts.map(check => (
                    <div key={check.id} className="px-4 py-4 border-l-2 border-l-destructive/50">
                      {/* Detection header */}
                      <div className="flex items-center gap-3 flex-wrap mb-2">
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

                      {/* Ad copy */}
                      {check.ads.map(ad => (
                        <div key={ad.id} className="ml-4 mb-2 last:mb-0 rounded border border-border p-3 bg-muted/20 text-xs">
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
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center pt-4 pb-8 border-t border-border">
          <p className="text-xs text-muted-foreground font-mono">
            {lastCheck && <>Last check: {new Date(lastCheck.checkedAt).toLocaleString('en-GB')} · </>}
            Monitoring {brand.keywords.length} keyword{brand.keywords.length !== 1 ? 's' : ''} · 3 checks per day
          </p>
          <p className="text-[10px] text-muted-foreground/60 font-mono mt-1">Powered by SerpAlert</p>
        </footer>
      </div>
    </div>
  )
}
