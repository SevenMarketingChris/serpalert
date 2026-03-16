import { notFound } from 'next/navigation'
import { getBrandById, getRecentSerpChecks, getCompetitorAdsForCheck, getAuctionInsightsLast30Days, getCompetitorProfiles, getCompetitorCount30Days, getActivePauseTest, getPauseTests } from '@/lib/db/queries'
import { CompetitorTimeline } from '@/components/competitor-timeline'
import { AuctionChart } from '@/components/auction-chart'
import { PauseButton } from '@/components/pause-button'
import { RunCheckButton } from '@/components/run-check-button'
import { RoasCalculator } from '@/components/roas-calculator'
import { BrandEnricher } from '@/components/brand-enricher'
import { PauseTestTracker } from '@/components/pause-test-tracker'
import { SpendEstimator } from '@/components/spend-estimator'
import { BrandSettings } from '@/components/brand-settings'
import { getLogoUrl } from '@/lib/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { computeThreatScore } from '@/lib/threat-score'

export default async function DashboardPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params
  const brand = await getBrandById(brandId)
  if (!brand) notFound()

  const checks = await getRecentSerpChecks(brandId, 200)
  const checksWithAds = await Promise.all(checks.map(async c => ({ ...c, ads: await getCompetitorAdsForCheck(c.id) })))
  const insights = await getAuctionInsightsLast30Days(brandId)
  const competitorProfiles = await getCompetitorProfiles(brandId)
  const { totalChecks: totalChecks30d, checksWithCompetitors: competitorChecks30d } = await getCompetitorCount30Days(brandId)
  const [activePauseTest, pauseTests] = await Promise.all([
    getActivePauseTest(brandId),
    getPauseTests(brandId),
  ])
  const faviconUrl = getLogoUrl(brand.websiteUrl)
  const logoUrl = brand.logoUrl ?? faviconUrl

  const todayStr = new Date().toDateString()
  const todayChecks = checksWithAds.filter(c => new Date(c.checkedAt).toDateString() === todayStr)
  const competitorsToday = new Set(todayChecks.flatMap(c => c.ads.map(a => a.domain))).size
  const allDomains = new Set(checksWithAds.flatMap(c => c.ads.map(a => a.domain)))
  const lastCheck = checks[0] ? new Date(checks[0].checkedAt) : null
  const last7days = checksWithAds.filter(c => {
    const d = new Date(c.checkedAt)
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7)
    return d > cutoff
  })
  const competitorsLast7 = new Set(last7days.flatMap(c => c.ads.map(a => a.domain))).size

  // Compute threat scores for all competitor profiles
  const profilesWithScores = competitorProfiles.map(p => ({
    ...p,
    threat: computeThreatScore(p, totalChecks30d, brand.keywords.length),
  }))
  const escalatingDomains = profilesWithScores.filter(p => p.threat.isEscalating)
  const criticalThreats = profilesWithScores.filter(p => p.threat.level === 'critical')

  const keywordStatus: Record<string, { count: number; lastChecked: Date | null }> = {}
  for (const kw of brand.keywords) {
    const kwChecks = checksWithAds.filter(c => c.keyword === kw)
    const latest = kwChecks[0]
    keywordStatus[kw] = {
      count: latest?.competitorCount ?? 0,
      lastChecked: latest ? new Date(latest.checkedAt) : null,
    }
  }

  return (
    <div className="min-h-screen bg-[var(--c-bg)]">
      <header className="sticky top-0 z-20 bg-[var(--c-bg)]/90 backdrop-blur-xl border-b border-[var(--c-border)]" style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="/admin" className="flex items-center justify-center w-6 h-6 rounded-md bg-[#FF6B35] hover:bg-[#E55A25] transition-colors shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </a>
            <span className="text-[var(--c-border)]">/</span>
            <div className="flex items-center gap-1.5">
              {logoUrl && (
                <div className="w-5 h-5 rounded-md bg-[var(--c-card-secondary)] flex items-center justify-center overflow-hidden shrink-0" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06)' }}>
                  <img src={logoUrl} alt={brand.name} className="w-4 h-4 object-contain" />
                </div>
              )}
              <span className="font-medium text-[var(--c-text)] text-[14px]">{brand.name}</span>
            </div>
            {lastCheck && (
              <span className="text-[12px] text-[var(--c-text-faint)] hidden sm:block ml-1">
                · {lastCheck.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <PauseButton brandId={brand.id} initialActive={brand.active} />
            <RunCheckButton brandId={brand.id} />
            <ThemeToggle />
            <a href={`/dashboard/${brand.id}/evidence`} className="text-[12px] text-[var(--c-text-faint)] hover:text-[var(--c-text-muted)] transition-colors hidden sm:block">Evidence</a>
            <a href="/admin" className="text-[12px] text-[var(--c-text-faint)] hover:text-[var(--c-text-muted)] transition-colors hidden sm:block">All clients</a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* Brand profile card */}
        <div className="bg-[var(--c-card)] rounded-2xl p-6 mb-6 flex items-start gap-5" style={{ boxShadow: 'var(--c-shadow)' }}>
          {brand.logoUrl ? (
            <div className="w-16 h-16 rounded-2xl bg-[var(--c-card-secondary)] flex items-center justify-center overflow-hidden shrink-0" style={{ boxShadow: 'var(--c-shadow-sm)' }}>
              <img src={brand.logoUrl} alt={brand.name} className="w-14 h-14 object-contain" />
            </div>
          ) : faviconUrl ? (
            <div className="w-16 h-16 rounded-2xl bg-[var(--c-card-secondary)] flex items-center justify-center overflow-hidden shrink-0" style={{ boxShadow: 'var(--c-shadow-sm)' }}>
              <img src={faviconUrl} alt={brand.name} className="w-9 h-9 object-contain" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[#FF6B35]/10 flex items-center justify-center shrink-0" style={{ boxShadow: 'var(--c-shadow-sm)' }}>
              <span className="text-[#FF6B35] text-[24px] font-bold">{brand.name[0]?.toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2.5 mb-1 flex-wrap">
              <h1 className="text-[18px] font-bold text-[var(--c-text)] tracking-tight">{brand.name}</h1>
              {brand.websiteUrl && (
                <a href={brand.websiteUrl} target="_blank" rel="noreferrer"
                  className="text-[12px] text-[var(--c-text-muted)] hover:text-[#FF6B35] transition-colors truncate">
                  {new URL(brand.websiteUrl).hostname.replace(/^www\./, '')} ↗
                </a>
              )}
              {brand.phone && (
                <span className="text-[12px] text-[var(--c-text-muted)]">{brand.phone}</span>
              )}
            </div>
            {brand.description ? (
              <p className="text-[13px] text-[var(--c-text-muted)] leading-relaxed line-clamp-2 mb-3">{brand.description}</p>
            ) : (
              <p className="text-[12px] text-[var(--c-text-faint)] italic mb-3">No description yet — pull site info to populate</p>
            )}
            <BrandEnricher brandId={brand.id} hasWebsite={!!brand.websiteUrl} />
          </div>
        </div>

        {competitorsToday > 0 && (
          <div className="mb-5 bg-[#E54D42]/8 border border-[#E54D42]/20 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#E54D42] animate-pulse" />
              <p className="text-[14px] font-semibold text-[#E54D42]">
                {competitorsToday} competitor{competitorsToday !== 1 ? 's' : ''} detected bidding on {brand.name} today
              </p>
            </div>
            <p className="text-[12px] text-[#E54D42]/50">See scan history below for ad copy</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Scans today', value: todayChecks.length, sub: `${brand.keywords.length} keyword${brand.keywords.length !== 1 ? 's' : ''} monitored`, accent: false },
            { label: 'Competitors today', value: competitorsToday, sub: competitorsToday > 0 ? 'Bidding on your brand' : 'Brand clean today', accent: competitorsToday > 0 },
            { label: 'Last 7 days', value: competitorsLast7, sub: 'competitor domains', accent: false },
            { label: 'All time', value: allDomains.size, sub: 'unique domains seen', accent: false },
          ].map(({ label, value, sub, accent }) => (
            <div key={label} className={`rounded-2xl p-5 ${accent ? 'bg-[#FF3B30]/6' : 'bg-[var(--c-card)]'}`} style={{ boxShadow: accent ? '0 0 0 1px rgba(255,59,48,0.15)' : 'var(--c-shadow)' }}>
              <p className="text-[10px] font-semibold text-[var(--c-text-muted)] uppercase tracking-widest mb-3">{label}</p>
              <p className={`text-[44px] font-black tabular-nums leading-none tracking-tight ${accent ? 'text-[#FF3B30]' : value === 0 && label === 'Competitors today' ? 'text-[#30D158]' : 'text-[var(--c-text)]'}`}>
                {value}
              </p>
              <p className={`text-[12px] mt-2 ${accent ? 'text-[#FF3B30]/60' : 'text-[var(--c-text-muted)]'}`}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Brand variants */}
        {brand.keywords.length > 0 && (
          <div className="bg-[var(--c-card)] rounded-2xl mb-6 overflow-hidden" style={{ boxShadow: 'var(--c-shadow)' }}>
            <div className="px-5 py-4 border-b border-[var(--c-border)]">
              <h2 className="text-[15px] font-semibold text-[var(--c-text)]">Keywords Monitored</h2>
              <p className="text-[12px] text-[var(--c-text-muted)] mt-0.5">Live status from the most recent scan for each search term</p>
            </div>
            <div className="divide-y divide-[var(--c-border)]">
              {brand.keywords.map(kw => {
                const s = keywordStatus[kw]
                const hasCompetitor = s.count > 0
                return (
                  <div key={kw} className={`flex items-center justify-between px-5 py-3.5 ${hasCompetitor ? 'bg-[#FF3B30]/4' : ''}`}>
                    <span className="text-[14px] font-medium text-[var(--c-text)]">{kw}</span>
                    {!s.lastChecked ? (
                      <span className="text-[var(--c-text-faint)] text-[12px]">Not scanned yet</span>
                    ) : hasCompetitor ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FF3B30]/8 text-[#FF3B30] text-[12px] font-semibold rounded-full border border-[#FF3B30]/15">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30]" />
                        {s.count} ad{s.count !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#30D158]/8 text-[#30D158] text-[12px] font-medium rounded-full border border-[#30D158]/15">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]" />
                        Clean
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ROAS Calculator */}
        <div className="bg-[var(--c-card)] rounded-2xl p-6 mb-6" style={{ boxShadow: 'var(--c-shadow)' }}>
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-[15px] font-semibold text-[var(--c-text)]">Brand Campaign ROI</h2>
            <a href={`/dashboard/${brand.id}/roi-report`} className="text-[12px] text-[#FF6B35] hover:text-[#E55A25] transition-colors flex items-center gap-1">
              Full report
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </a>
          </div>
          <p className="text-[12px] text-[var(--c-text-muted)] mb-5">Calculate whether your brand keyword spend is justified by competitor activity</p>
          <RoasCalculator
            brandId={brand.id}
            initialSpend={brand.monthlyBrandSpend}
            initialRoas={brand.brandRoas}
            competitorChecks30d={competitorChecks30d}
            totalChecks30d={totalChecks30d}
          />
        </div>

        {/* Pause Test Tracker */}
        <div className="bg-[var(--c-card)] rounded-2xl p-6 mb-6" style={{ boxShadow: 'var(--c-shadow)' }}>
          <h2 className="text-[15px] font-semibold text-[var(--c-text)] mb-1">Pause Test</h2>
          <p className="text-[12px] text-[var(--c-text-muted)] mb-5">Pause your brand campaign and track whether competitor activity changes — proves the campaign&apos;s value</p>
          <PauseTestTracker brandId={brand.id} activePauseTest={activePauseTest} pastTests={pauseTests} />
        </div>

        {/* Competitor Spend Estimator */}
        {insights.length > 0 && (
          <div className="bg-[var(--c-card)] rounded-2xl p-6 mb-6" style={{ boxShadow: 'var(--c-shadow)' }}>
            <h2 className="text-[15px] font-semibold text-[var(--c-text)] mb-1">Competitor Spend Estimator</h2>
            <p className="text-[12px] text-[var(--c-text-muted)] mb-5">Estimate how much competitors are spending to bid on your brand terms, using Auction Insights impression share</p>
            <SpendEstimator
              brandId={brand.id}
              initialAvgCpc={brand.avgBrandCpc}
              initialMonthlySearches={brand.monthlyBrandSearches}
              auctionInsights={insights}
            />
          </div>
        )}

        {/* Brand Settings (white-label + report email) */}
        <div className="bg-[var(--c-card)] rounded-2xl p-6 mb-6" style={{ boxShadow: 'var(--c-shadow)' }}>
          <h2 className="text-[15px] font-semibold text-[var(--c-text)] mb-1">White-Label & Reports</h2>
          <p className="text-[12px] text-[var(--c-text-muted)] mb-5">Customise the client portal branding and set up the monthly email digest</p>
          <BrandSettings
            brandId={brand.id}
            initialAgencyName={brand.agencyName}
            initialAgencyLogoUrl={brand.agencyLogoUrl}
            initialAgencyPrimaryColor={brand.agencyPrimaryColor}
            initialReportEmail={brand.reportEmail}
          />
        </div>

        {/* Escalation alert banner */}
        {escalatingDomains.length > 0 && (
          <div className="mb-5 bg-[#FF9F0A]/8 border border-[#FF9F0A]/20 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-2 h-2 rounded-full bg-[#FF9F0A] animate-pulse" />
              <p className="text-[14px] font-semibold text-[#FF9F0A]">
                {escalatingDomains.length === 1
                  ? `${escalatingDomains[0].domain} is escalating bid activity`
                  : `${escalatingDomains.length} competitors are increasing bid activity`}
              </p>
            </div>
            <p className="text-[12px] text-[#FF9F0A]/70 pl-4.5">
              {escalatingDomains.map(d => d.domain).join(', ')} — appearing more frequently in the last 7 days than the prior 7 days.
            </p>
          </div>
        )}

        {/* Competitor Profiles */}
        {profilesWithScores.length > 0 && (
          <div className="bg-[var(--c-card)] rounded-2xl overflow-hidden mb-6" style={{ boxShadow: 'var(--c-shadow)' }}>
            <div className="px-5 py-4 border-b border-[var(--c-border)] flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-semibold text-[var(--c-text)]">Competitors</h2>
                <p className="text-[12px] text-[var(--c-text-muted)] mt-0.5">All domains ever seen bidding on your brand terms — sorted by threat level</p>
              </div>
              {criticalThreats.length > 0 && (
                <span className="text-[11px] font-semibold text-[#FF3B30] bg-[#FF3B30]/8 border border-[#FF3B30]/15 px-2.5 py-1 rounded-full">
                  {criticalThreats.length} critical
                </span>
              )}
            </div>
            <div className="divide-y divide-[var(--c-border)]">
              {profilesWithScores
                .sort((a, b) => b.threat.score - a.threat.score)
                .map(profile => (
                <a
                  key={profile.domain}
                  href={`/dashboard/${brandId}/competitors/${encodeURIComponent(profile.domain)}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-[var(--c-card-secondary)] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-xl bg-[var(--c-card-secondary)] flex items-center justify-center shrink-0 overflow-hidden" style={{ boxShadow: 'var(--c-shadow-sm)' }}>
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${profile.domain}&sz=32`}
                          alt=""
                          className="w-5 h-5 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>
                      <div
                        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--c-card)]"
                        style={{ backgroundColor: profile.threat.color }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] text-[var(--c-text)] font-semibold truncate">{profile.domain}</p>
                        {profile.threat.isEscalating && (
                          <span className="text-[9px] font-bold text-[#FF9F0A] bg-[#FF9F0A]/10 px-1.5 py-0.5 rounded-full border border-[#FF9F0A]/20 shrink-0 uppercase tracking-wide">↑ Escalating</span>
                        )}
                      </div>
                      <p className="text-[12px] text-[var(--c-text-muted)] truncate mt-0.5">
                        {profile.uniqueKeywords.slice(0, 3).join(', ')}{profile.uniqueKeywords.length > 3 ? ` +${profile.uniqueKeywords.length - 3} more` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 shrink-0 ml-3">
                    <div className="text-right">
                      <p className="text-[12px] font-bold tabular-nums" style={{ color: profile.threat.color }}>{profile.threat.label}</p>
                      <p className="text-[11px] text-[var(--c-text-faint)]">{profile.threat.score}/10</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[13px] text-[var(--c-text)] tabular-nums font-semibold">{profile.totalAppearances}</p>
                      <p className="text-[11px] text-[var(--c-text-muted)]">appearances</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[12px] text-[var(--c-text-secondary)] tabular-nums">
                        {new Date(profile.lastSeen).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-[11px] text-[var(--c-text-muted)]">last seen</p>
                    </div>
                    <svg className="w-4 h-4 text-[var(--c-text-faint)] group-hover:text-[var(--c-text-muted)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Auction Insights */}
        {insights.length > 0 && (
          <div className="bg-[var(--c-card)] rounded-2xl p-6 mb-6" style={{ boxShadow: 'var(--c-shadow)' }}>
            <h2 className="text-[15px] font-semibold text-[var(--c-text)] mb-1">Auction Insights</h2>
            <p className="text-[12px] text-[var(--c-text-muted)] mb-5">How often competitors appear alongside your brand terms — last 30 days</p>
            <AuctionChart insights={insights} />
          </div>
        )}

        {/* Scan history */}
        <div className="bg-[var(--c-card)] rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--c-shadow)' }}>
          <div className="px-5 py-4 border-b border-[var(--c-border)]">
            <h2 className="text-[15px] font-semibold text-[var(--c-text)]">Scan History</h2>
            <p className="text-[12px] text-[var(--c-text-muted)] mt-0.5">{checks.length} checks — competitor ads appear inline, click any entry to expand</p>
          </div>
          <div className="p-6">
            <CompetitorTimeline checks={checksWithAds} />
          </div>
        </div>
      </main>
    </div>
  )
}
