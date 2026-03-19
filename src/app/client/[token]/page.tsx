import { notFound } from 'next/navigation'
import { getBrandByToken, getRecentSerpChecks, getCompetitorAdsForChecks } from '@/lib/db/queries'
import { ScreenshotModal } from '@/components/screenshot-modal'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { CompetitorAd, SerpCheck } from '@/lib/db/schema'

type CheckWithAds = SerpCheck & { ads: CompetitorAd[] }

function groupChecksByDate(checks: CheckWithAds[]): Record<string, CheckWithAds[]> {
  const groups: Record<string, CheckWithAds[]> = {}
  for (const check of checks) {
    const date = new Date(check.checkedAt).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    })
    if (!groups[date]) groups[date] = []
    groups[date].push(check)
  }
  return groups
}

function getUniqueCompetitors(checks: CheckWithAds[]): { domain: string; count: number; keywords: string[] }[] {
  const map = new Map<string, Set<string>>()
  for (const check of checks) {
    for (const ad of check.ads) {
      if (!map.has(ad.domain)) map.set(ad.domain, new Set())
      map.get(ad.domain)!.add(check.keyword)
    }
  }
  return [...map.entries()]
    .map(([domain, keywords]) => ({ domain, count: keywords.size, keywords: [...keywords] }))
    .sort((a, b) => b.count - a.count)
}

export default async function ClientPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const brand = await getBrandByToken(token)
  if (!brand) notFound()

  const checks = await getRecentSerpChecks(brand.id, 200)
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
  const checksWithCompetitors = checksWithAds.filter(c => c.competitorCount > 0)
  const totalChecks = checks.length
  const allTimeCompetitors = new Set(allAds.map(a => a.domain)).size
  const groupedByDate = groupChecksByDate(checksWithAds)
  const topCompetitors = getUniqueCompetitors(checksWithAds)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-5">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-1">Brand Monitor</p>
            <h1 className="text-2xl font-bold text-gradient-tech">{brand.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            {competitorsToday === 0 ? (
              <Badge variant="outline" className="font-mono text-xs border-green-500/40 text-tech-green">
                ALL CLEAR TODAY
              </Badge>
            ) : (
              <Badge variant="destructive" className="font-mono text-xs">
                {competitorsToday} COMPETITOR{competitorsToday > 1 ? 'S' : ''} TODAY
              </Badge>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-5xl space-y-8">

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="metric-stripe-purple">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-1">Checks Run</p>
              <p className="font-mono text-2xl font-bold text-tech-purple">{totalChecks}</p>
            </CardContent>
          </Card>
          <Card className={competitorsToday === 0 ? 'metric-stripe-green' : 'metric-stripe-blue'}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-1">Competitors Today</p>
              <p className={`font-mono text-2xl font-bold ${competitorsToday === 0 ? 'text-tech-green' : 'text-tech-blue'}`}>{competitorsToday}</p>
            </CardContent>
          </Card>
          <Card className="metric-stripe-orange">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-1">Keywords Monitored</p>
              <p className="font-mono text-2xl font-bold text-tech-orange">{brand.keywords.length}</p>
            </CardContent>
          </Card>
          <Card className="metric-stripe-cyan">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-1">Unique Competitors</p>
              <p className="font-mono text-2xl font-bold text-tech-cyan">{allTimeCompetitors}</p>
            </CardContent>
          </Card>
        </div>

        {/* Keywords being monitored */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-mono mb-3">Monitored Keywords</h2>
          <div className="flex flex-wrap gap-2">
            {brand.keywords.map(kw => (
              <span
                key={kw}
                className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 font-mono text-xs text-primary"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Top competitors table */}
        {topCompetitors.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-mono mb-3">Competitor Domains Detected</h2>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {topCompetitors.map(comp => (
                    <div key={comp.domain} className="flex items-center gap-4 px-4 py-3">
                      <span className="font-mono text-sm font-medium flex-1">{comp.domain}</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {comp.keywords.map(kw => (
                          <span key={kw} className="text-xs bg-destructive/5 text-destructive border border-destructive/15 rounded px-1.5 py-0.5 font-mono">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Activity log grouped by date */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-mono mb-3">Activity Log</h2>

          {checks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No checks yet — data will appear after the first scheduled check.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByDate).map(([date, dayChecks]) => {
                const dayCompetitors = new Set(dayChecks.flatMap(c => c.ads.map(a => a.domain))).size
                return (
                  <div key={date}>
                    {/* Date header */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-semibold">{date}</h3>
                      {dayCompetitors > 0 ? (
                        <span className="text-xs font-mono text-destructive">{dayCompetitors} competitor{dayCompetitors > 1 ? 's' : ''}</span>
                      ) : (
                        <span className="text-xs font-mono text-tech-green">Clear</span>
                      )}
                    </div>

                    {/* Checks for this day */}
                    <Card className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="divide-y divide-border">
                          {dayChecks.map(check => (
                            <div key={check.id} className={`px-4 py-3 ${check.competitorCount > 0 ? 'border-l-2 border-l-destructive/50' : ''}`}>
                              {/* Check row */}
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-mono text-xs text-muted-foreground">
                                  {new Date(check.checkedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-sm font-medium">{check.keyword}</span>
                                {check.competitorCount > 0 ? (
                                  <Badge variant="destructive" className="text-xs">
                                    {check.competitorCount} found
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-tech-green font-mono">Clear</span>
                                )}
                                {check.screenshotUrl && (
                                  <div className="ml-auto">
                                    <ScreenshotModal screenshotUrl={check.screenshotUrl} keyword={check.keyword} />
                                  </div>
                                )}
                              </div>

                              {/* Ad details */}
                              {check.ads.length > 0 && (
                                <div className="mt-2 space-y-2 pl-12">
                                  {check.ads.map(ad => (
                                    <div key={ad.id} className="rounded border border-border bg-muted/30 p-2.5 text-xs">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Ad</Badge>
                                        <span className="font-mono text-muted-foreground truncate">{ad.displayUrl ?? ad.domain}</span>
                                        {ad.position != null && (
                                          <span className="ml-auto font-mono text-tech-orange shrink-0">Pos {ad.position}</span>
                                        )}
                                      </div>
                                      {ad.headline && <p className="text-primary font-semibold leading-snug">{ad.headline}</p>}
                                      {ad.description && <p className="text-foreground/60 mt-0.5 leading-relaxed line-clamp-2">{ad.description}</p>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground font-mono">
            {lastCheck && <>Last check: {new Date(lastCheck.checkedAt).toLocaleString('en-GB')} · </>}
            Monitoring {brand.keywords.length} keyword{brand.keywords.length !== 1 ? 's' : ''} · Powered by SerpAlert
          </p>
        </div>
      </div>
    </div>
  )
}
