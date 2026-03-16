import { notFound } from 'next/navigation'
import { getBrandByToken, getRecentSerpChecks, getCompetitorAdsForCheck, getAuctionInsightsLast30Days } from '@/lib/db/queries'
import { CompetitorTimeline } from '@/components/competitor-timeline'
import { AuctionChart } from '@/components/auction-chart'
import { getLogoUrl } from '@/lib/logo'
import { ThemeToggle } from '@/components/theme-toggle'

export default async function ClientPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const brand = await getBrandByToken(token)
  if (!brand) notFound()

  const checks = await getRecentSerpChecks(brand.id, 200)
  const checksWithAds = await Promise.all(checks.map(async c => ({ ...c, ads: await getCompetitorAdsForCheck(c.id) })))
  const insights = await getAuctionInsightsLast30Days(brand.id)
  const faviconUrl = getLogoUrl(brand.websiteUrl)
  const logoUrl = brand.logoUrl ?? faviconUrl
  const lastCheck = checks[0] ? new Date(checks[0].checkedAt) : null

  const todayStr = new Date().toDateString()
  const todayChecks = checksWithAds.filter(c => new Date(c.checkedAt).toDateString() === todayStr)
  const competitorsToday = new Set(todayChecks.flatMap(c => c.ads.map(a => a.domain))).size
  const last30days = checksWithAds.filter(c => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30)
    return new Date(c.checkedAt) > cutoff
  })
  const competitorsLast30 = new Set(last30days.flatMap(c => c.ads.map(a => a.domain))).size
  const totalScans = checks.length

  const accentColor = brand.agencyPrimaryColor ?? '#FF6B35'
  const agencyLogoUrl = brand.agencyLogoUrl
  const agencyName = brand.agencyName ?? 'SerpAlert'

  return (
    <div className="min-h-screen bg-[var(--c-bg)]">
      {/* Per-brand accent color override */}
      <style>{`:root { --c-accent: ${accentColor}; }`}</style>
      <header className="sticky top-0 z-20 bg-[var(--c-bg)]/90 backdrop-blur-xl border-b border-[var(--c-border)]" style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {agencyLogoUrl ? (
              <div className="h-7 flex items-center">
                <img src={agencyLogoUrl} alt={agencyName} className="h-7 w-auto object-contain" />
              </div>
            ) : (
              <div className="flex items-center justify-center w-6 h-6 rounded-md" style={{ background: accentColor }}>
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            )}
            {logoUrl && (
              <div className="w-5 h-5 rounded-md bg-[var(--c-card-secondary)] flex items-center justify-center overflow-hidden">
                <img src={logoUrl} alt={brand.name} className="w-4 h-4 object-contain" />
              </div>
            )}
            <span className="font-medium text-[var(--c-text)] text-[14px]">{brand.name}</span>
            <span className="text-[12px] text-[var(--c-text-faint)] hidden sm:block">· Brand Protection Report</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {competitorsToday > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium bg-[#E54D42]/10 text-[#E54D42] rounded-lg border border-[#E54D42]/15">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E54D42] animate-pulse" />
                {competitorsToday} competitor{competitorsToday > 1 ? 's' : ''} today
              </span>
            ) : totalScans > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium bg-[#59D499]/10 text-[#59D499] rounded-lg border border-[#59D499]/15">
                <span className="w-1.5 h-1.5 rounded-full bg-[#59D499]" />
                Brand clean today
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Brand hero */}
        <div className="bg-[var(--c-card)] rounded-2xl p-6 mb-6 flex items-start gap-5" style={{ boxShadow: 'var(--c-shadow)' }}>
          {logoUrl ? (
            <div className="w-16 h-16 rounded-2xl bg-[var(--c-card-secondary)] flex items-center justify-center overflow-hidden shrink-0" style={{ boxShadow: 'var(--c-shadow-sm)' }}>
              <img src={logoUrl} alt={brand.name} className={brand.logoUrl ? 'w-14 h-14 object-contain' : 'w-9 h-9 object-contain'} />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${accentColor}15`, boxShadow: 'var(--c-shadow-sm)' }}>
              <span style={{ color: accentColor }} className="text-[24px] font-bold">{brand.name[0]?.toUpperCase()}</span>
            </div>
          )}
          <div className="pt-0.5">
            <h1 className="text-[18px] font-bold text-[var(--c-text)] tracking-tight mb-1">{brand.name} — Brand Protection</h1>
            {brand.description && (
              <p className="text-[13px] text-[var(--c-text-muted)] leading-relaxed mb-2">{brand.description}</p>
            )}
            <p className="text-[var(--c-text-muted)] text-[12px]">
              Monitoring {brand.keywords.length} branded search term{brand.keywords.length !== 1 ? 's' : ''} on Google Ads, 3× daily.
              {lastCheck && ` Last checked ${lastCheck.toLocaleString('en-GB', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}.`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className={`rounded-2xl p-5 ${competitorsToday > 0 ? 'bg-[#FF3B30]/6' : 'bg-[var(--c-card)]'}`} style={{ boxShadow: competitorsToday > 0 ? '0 0 0 1px rgba(255,59,48,0.15)' : 'var(--c-shadow)' }}>
            <p className="text-[10px] font-semibold text-[var(--c-text-muted)] uppercase tracking-widest mb-3">Status today</p>
            {competitorsToday > 0 ? (
              <>
                <p className="text-[44px] font-black text-[#FF3B30] tabular-nums leading-none tracking-tight">{competitorsToday}</p>
                <p className="text-[12px] text-[#FF3B30]/60 mt-2">Competitor{competitorsToday > 1 ? 's' : ''} detected</p>
              </>
            ) : (
              <>
                <p className="text-[44px] font-black text-[#30D158] tabular-nums leading-none tracking-tight">0</p>
                <p className="text-[12px] text-[var(--c-text-muted)] mt-2">Brand clean today</p>
              </>
            )}
          </div>
          <div className="bg-[var(--c-card)] rounded-2xl p-5" style={{ boxShadow: 'var(--c-shadow)' }}>
            <p className="text-[10px] font-semibold text-[var(--c-text-muted)] uppercase tracking-widest mb-3">30-day exposure</p>
            <p className="text-[44px] font-black text-[var(--c-text)] tabular-nums leading-none tracking-tight">{competitorsLast30}</p>
            <p className="text-[12px] text-[var(--c-text-muted)] mt-2">distinct competitor domains</p>
          </div>
          <div className="bg-[var(--c-card)] rounded-2xl p-5" style={{ boxShadow: 'var(--c-shadow)' }}>
            <p className="text-[10px] font-semibold text-[var(--c-text-muted)] uppercase tracking-widest mb-3">Total scans</p>
            <p className="text-[44px] font-black text-[var(--c-text)] tabular-nums leading-none tracking-tight">{totalScans}</p>
            <p className="text-[12px] text-[var(--c-text-muted)] mt-2">checks completed</p>
          </div>
        </div>

        {insights.length > 0 && (
          <div className="bg-[var(--c-card)] rounded-2xl p-6 mb-6" style={{ boxShadow: 'var(--c-shadow)' }}>
            <h2 className="text-[15px] font-semibold text-[var(--c-text)] mb-1">Auction Insights</h2>
            <p className="text-[12px] text-[var(--c-text-muted)] mb-5">How often competitors appear alongside your brand in Google Ads — last 30 days</p>
            <AuctionChart insights={insights} />
          </div>
        )}

        <div className="bg-[var(--c-card)] rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--c-shadow)' }}>
          <div className="px-5 py-4 border-b border-[var(--c-border)]">
            <h2 className="text-[15px] font-semibold text-[var(--c-text)]">Scan Log</h2>
            <p className="text-[12px] text-[var(--c-text-muted)] mt-0.5">Every check — competitor ads appear inline</p>
          </div>
          <div className="p-6">
            <CompetitorTimeline checks={checksWithAds} />
          </div>
        </div>
      </main>
    </div>
  )
}
