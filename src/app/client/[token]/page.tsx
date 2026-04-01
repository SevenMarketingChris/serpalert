import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getBrandByToken, getRecentSerpChecks, getCompetitorAdsForChecks, getCompetitorSummaryForBrand } from '@/lib/db/queries'
import { ScreenshotModal } from '@/components/screenshot-modal'
import { StatusHero } from '@/components/status-hero'
import { ClientMetricCards } from '@/components/client-metric-cards'
import { Badge } from '@/components/ui/badge'
import { getRelativeTime, toUTCDate } from '@/lib/time'
import { BarChart3 } from 'lucide-react'
import { ShareReportButton } from '@/components/share-report-button'
import type { CompetitorAd, SerpCheck } from '@/lib/db/schema'
import { AppHeader } from '@/components/app-header'

export const metadata: Metadata = { title: 'Brand Monitoring Report', robots: { index: false, follow: false } }

type CheckWithAds = SerpCheck & { ads: CompetitorAd[] }

function getDailyStats(checks: CheckWithAds[], days: number) {
  const stats: { date: string; checks: number; threats: number }[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = toUTCDate(d)
    const dayChecks = checks.filter(c => toUTCDate(new Date(c.checkedAt)) === dateStr)
    const dayThreats = new Set(dayChecks.flatMap(c => c.ads.map(a => a.domain))).size
    stats.push({
      date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      checks: dayChecks.length,
      threats: dayThreats,
    })
  }
  return stats
}

// NS-01: Client portal tokens are v4 UUIDs (128-bit entropy / ~3.4×10³⁸ possibilities).
// Brute-forcing is not feasible. Rate limiting on this server component page route
// would require middleware-level changes and is not warranted given the token entropy.
export default async function ClientPortal({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const brand = await getBrandByToken(token)
  if (!brand) notFound()

  const checks = await getRecentSerpChecks(brand.id, 100)
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

  // Count 7-day competitors from actual checks data
  const last7DayChecks = checksWithAds.filter(c => {
    const checkDate = new Date(c.checkedAt)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return checkDate >= sevenDaysAgo
  })
  const competitors7d = new Set(last7DayChecks.flatMap(c => c.ads.map(a => a.domain))).size

  // Count days with actual data for chart visibility
  const daysWithData = last7Days.filter(d => d.checks > 0).length

  // AI-generated executive summary
  let aiSummary: string | null = null
  try {
    const { generateCompetitiveLandscape } = await import('@/lib/ai')
    const currentMonth = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    aiSummary = await generateCompetitiveLandscape(brand.name, {
      totalChecks: checks.length,
      competitors: competitorStats.map(c => ({
        domain: c.domain,
        count: c.recentCount,
        avgPosition: c.avgPosition,
      })),
      keywordsMonitored: brand.keywords.length,
      monthName: currentMonth,
    })
  } catch (err) {
    // AI unavailable — fallback to hardcoded summary
    console.warn('[client-portal] AI landscape generation failed:', err instanceof Error ? err.message : 'Unknown error')
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader maxWidth="max-w-4xl" showThemeToggle={true} />

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Brand Report Header */}
        <header className="text-center space-y-1">
          <p className="text-xs uppercase tracking-[2px] text-muted-foreground">
            Brand Protection Report &middot; {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-3xl font-extrabold text-gradient-tech">{brand.name}</h1>
          <p className="text-sm text-muted-foreground">
            Monitoring {brand.keywords.length} branded search{brand.keywords.length !== 1 ? 'es' : ''} for competitor ads
          </p>
          <div className="pt-2 flex justify-center">
            <ShareReportButton brandName={brand.name} portalUrl={`${process.env.NEXT_PUBLIC_APP_URL || 'https://serpalert.co.uk'}/client/${token}`} />
          </div>
        </header>

        {/* 2. Status Hero */}
        <StatusHero
          brandId={brand.id}
          threatsToday={competitorsToday}
          lastCheckAt={lastCheck?.checkedAt ? new Date(lastCheck.checkedAt).toISOString() : null}
          showCheckButton={false}
        />

        {/* 3. Metric Cards (moved UP) */}
        <ClientMetricCards
          keywordCount={brand.keywords.length}
          totalChecks={totalChecks}
          todayThreats={competitorsToday}
          allTimeCompetitors={competitorStats.length}
        />

        {/* 4. AI Executive Summary */}
        <div className="bg-muted/40 border border-border rounded-lg px-5 py-4">
          <h2 className="text-xs uppercase tracking-[1.5px] font-mono text-muted-foreground mb-1.5 flex items-center gap-2">
            <span className="w-0.5 h-3 bg-primary rounded-full inline-block" />
            Executive Summary
          </h2>
          {aiSummary ? (
            <p className="text-xs text-muted-foreground leading-relaxed">{aiSummary}</p>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {competitors7d === 0 || competitorStats.length === 0 ? (
                `Over the past 7 days, we ran ${last7Days.reduce((s, d) => s + d.checks, 0)} scans across your ${brand.keywords.length} monitored keywords. No competitor ads were found — your brand search results are clear.`
              ) : (
                `Over the past 7 days, we ran ${last7Days.reduce((s, d) => s + d.checks, 0)} scans across your ${brand.keywords.length} monitored keywords. ${competitors7d} competitor${competitors7d !== 1 ? 's were' : ' was'} found advertising on your brand name. The most active was ${competitorStats[0].domain}, spotted ${competitorStats[0].recentCount} time${competitorStats[0].recentCount !== 1 ? 's' : ''}.`
              )}
            </p>
          )}
        </div>

        {/* 5. Competitor Ads Found — compact rows */}
        {recentThreats.length > 0 && (
          <section className="bg-card border border-border rounded-lg overflow-hidden">
            <h2 className="text-xs uppercase tracking-[1.5px] font-mono text-foreground/70 px-6 pt-6 mb-4 flex items-center gap-2">
              <span className="w-0.5 h-3 bg-destructive rounded-full inline-block" />
              Competitor Ads Found
            </h2>
            <div className="divide-y divide-border">
              {recentThreats.map(check => (
                <div key={check.id} className="px-6 py-3 border-l-4 border-l-destructive bg-destructive/[0.03]">
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
                    <div key={ad.id} className="ml-4 mt-1.5 flex items-start gap-3 text-xs">
                      <span className="font-mono font-medium text-foreground shrink-0">{ad.domain}</span>
                      <span className="text-muted-foreground truncate" title={ad.headline ?? undefined}>{ad.headline}</span>
                      {ad.position != null && (
                        <span className="ml-auto shrink-0 font-mono text-amber-500">Pos {ad.position}</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Competitor Domains Table (with First Seen) */}
        {competitorStats.length > 0 && (
          <section className="bg-card border border-border rounded-lg overflow-hidden">
            <h2 className="text-xs uppercase tracking-[1.5px] font-mono font-semibold text-foreground/80 px-6 pt-6 mb-4 flex items-center gap-2">
              <span className="w-0.5 h-3 bg-primary rounded-full inline-block" />
              Competitor Advertisers
            </h2>
            <p className="text-xs text-muted-foreground px-6 mb-4">
              These advertisers have been found running paid ads targeting your brand name.
            </p>
            {/* Desktop table */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-[1.2fr_60px_60px_1.2fr_80px_80px] gap-4 px-6 py-2 border-b border-border bg-muted/30 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                <span>Domain</span>
                <span className="text-right">Last 30d</span>
                <span className="text-right">Avg Pos</span>
                <span>Keywords Targeted</span>
                <span className="text-right">First Seen</span>
                <span className="text-right">Last Seen</span>
              </div>
              <div className="divide-y divide-border">
                {competitorStats.map(comp => (
                  <div key={comp.domain} className="grid grid-cols-[1.2fr_60px_60px_1.2fr_80px_80px] gap-4 px-6 py-3 items-center">
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
                      {new Date(comp.firstSeen).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
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
                    <span>First seen {new Date(comp.firstSeen).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. 7-Day Activity Chart (or not-enough-data message) */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xs uppercase tracking-[1.5px] font-mono text-foreground/70 mb-1 flex items-center gap-2">
            <span className="w-0.5 h-3 bg-primary rounded-full inline-block" />
            This Week
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Each day we scan Google for competitors advertising on your brand name.
          </p>
          {daysWithData < 3 ? (
            <div className="text-center py-10 space-y-2">
              <BarChart3 className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Not enough data yet — the chart will appear after a few days of monitoring.
              </p>
            </div>
          ) : (
            <>
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
            </>
          )}
        </section>

        {/* 8. Stale data warning */}
        {!lastCheck ? (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-600">
            Monitoring starting soon — your first check will run within the hour.
          </div>
        ) : (Date.now() - new Date(lastCheck.checkedAt).getTime()) > 48 * 60 * 60 * 1000 ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm text-amber-600 dark:text-amber-400">
            Monitoring may be paused — the last scan was more than 48 hours ago. Contact your account manager if this persists.
          </div>
        ) : null}

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
