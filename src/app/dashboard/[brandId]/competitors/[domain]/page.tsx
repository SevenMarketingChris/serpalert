import { notFound } from 'next/navigation'
import { getBrandById, getCompetitorAdHistory } from '@/lib/db/queries'
import { getLogoUrl } from '@/lib/logo'

export default async function CompetitorDetailPage({
  params,
}: {
  params: Promise<{ brandId: string; domain: string }>
}) {
  const { brandId, domain: domainParam } = await params
  const domain = decodeURIComponent(domainParam)

  const brand = await getBrandById(brandId)
  if (!brand) notFound()

  const history = await getCompetitorAdHistory(brandId, domain)
  if (history.length === 0) notFound()

  const brandLogoUrl = getLogoUrl(brand.websiteUrl)

  const firstSeen = history[history.length - 1].checkedAt
  const lastSeen = history[0].checkedAt
  const uniqueKeywords = [...new Set(history.map(h => h.keyword))]
  const uniqueHeadlines = [...new Set(history.map(h => h.headline).filter(Boolean))]

  // Group by date for timeline
  const byDate = new Map<string, typeof history>()
  for (const h of history) {
    const dateStr = h.checkedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    if (!byDate.has(dateStr)) byDate.set(dateStr, [])
    byDate.get(dateStr)!.push(h)
  }

  return (
    <div className="min-h-screen bg-[var(--c-bg)]">
      <header className="border-b border-[var(--c-border)] bg-[var(--c-bg)]/90 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-5 h-12 flex items-center gap-2">
          <a href="/admin" className="flex items-center justify-center w-6 h-6 rounded-md bg-[#FF6B35] hover:bg-[#E55A25] transition-colors shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </a>
          <span className="text-[var(--c-border)]">/</span>
          <div className="flex items-center gap-1.5">
            {brandLogoUrl && (
              <div className="w-5 h-5 rounded-md bg-[var(--c-card-secondary)] flex items-center justify-center overflow-hidden shrink-0">
                <img src={brandLogoUrl} alt={brand.name} className="w-4 h-4 object-contain" />
              </div>
            )}
            <a href={`/dashboard/${brandId}`} className="text-[14px] text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition-colors">{brand.name}</a>
          </div>
          <span className="text-[var(--c-border)]">/</span>
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-4 h-4 rounded bg-[var(--c-card-secondary)] flex items-center justify-center overflow-hidden shrink-0">
              <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="" className="w-3 h-3 object-contain" />
            </div>
            <span className="text-[14px] text-[var(--c-text)] font-medium truncate">{domain}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {[
            { label: 'Total appearances', value: history.length, sub: 'times detected in scans' },
            { label: 'Unique keywords', value: uniqueKeywords.length, sub: 'search terms targeted' },
            { label: 'First seen', value: firstSeen.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), sub: 'first detected bidding', isText: true },
            { label: 'Last seen', value: lastSeen.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), sub: 'most recent detection', isText: true },
          ].map(({ label, value, sub, isText }) => (
            <div key={label} className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-xl p-4">
              <p className="text-[10px] font-medium text-[var(--c-text-muted)] uppercase tracking-wider mb-2">{label}</p>
              <p className={`font-semibold tabular-nums leading-none text-[var(--c-text)] ${isText ? 'text-[16px]' : 'text-[28px]'}`}>{value}</p>
              <p className="text-[12px] text-[var(--c-text-muted)] mt-1.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Keywords targeted */}
        {uniqueKeywords.length > 0 && (
          <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-xl p-4 mb-4">
            <h2 className="text-[13px] font-semibold text-[var(--c-text)] mb-3">Keywords Targeted</h2>
            <div className="flex flex-wrap gap-2">
              {uniqueKeywords.map(kw => (
                <span key={kw} className="px-2.5 py-1 bg-[var(--c-card-secondary)] border border-[var(--c-border)] rounded-lg text-[12px] text-[var(--c-text-secondary)]">{kw}</span>
              ))}
            </div>
          </div>
        )}

        {/* Ad copy variations */}
        {uniqueHeadlines.length > 0 && (
          <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-xl overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-[var(--c-border)]">
              <h2 className="text-[13px] font-semibold text-[var(--c-text)]">Ad Copy Seen</h2>
              <p className="text-[11px] text-[var(--c-text-muted)] mt-0.5">All unique headlines this competitor has run</p>
            </div>
            <div className="divide-y divide-[var(--c-border)]">
              {[...new Map(history.filter(h => h.headline).map(h => [h.headline, h])).values()].map(ad => (
                <div key={ad.id} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 text-[10px] font-bold text-white bg-[#4285F4] px-1 py-0.5 rounded mt-0.5">Ad</span>
                    <div className="min-w-0">
                      {ad.displayUrl && (
                        <p className="text-[11px] text-[#59D499] mb-0.5 truncate">{ad.displayUrl}</p>
                      )}
                      {ad.headline && (
                        <p className="text-[13px] font-medium text-[var(--c-text)] mb-0.5">{ad.headline}</p>
                      )}
                      {ad.description && (
                        <p className="text-[12px] text-[var(--c-text-muted)]">{ad.description}</p>
                      )}
                      <p className="text-[10px] text-[var(--c-text-faint)] mt-1">
                        {ad.keyword} · {ad.checkedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Landing page gallery */}
        {history.some(h => h.landingPageScreenshotUrl) && (
          <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-xl overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-[var(--c-border)]">
              <h2 className="text-[13px] font-semibold text-[var(--c-text)]">Landing Page Captures</h2>
              <p className="text-[11px] text-[var(--c-text-muted)] mt-0.5">Screenshots of this competitor&apos;s ad landing pages when first detected</p>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {history
                .filter(h => h.landingPageScreenshotUrl)
                .filter((h, i, arr) => arr.findIndex(x => x.landingPageScreenshotUrl === h.landingPageScreenshotUrl) === i)
                .slice(0, 6)
                .map(h => (
                  <a
                    key={h.id}
                    href={h.landingPageScreenshotUrl!}
                    target="_blank"
                    rel="noreferrer"
                    className="group block rounded-lg overflow-hidden border border-[var(--c-border)] hover:border-[#FF6B35]/40 transition-colors relative"
                  >
                    <img
                      src={h.landingPageScreenshotUrl!}
                      alt={`Landing page captured ${h.checkedAt.toLocaleDateString('en-GB')}`}
                      className="w-full aspect-video object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white/80">{h.checkedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </a>
                ))}
            </div>
          </div>
        )}

        {/* Detection timeline */}
        <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--c-border)]">
            <h2 className="text-[13px] font-semibold text-[var(--c-text)]">Detection Timeline</h2>
            <p className="text-[11px] text-[var(--c-text-muted)] mt-0.5">Every scan where this competitor was found</p>
          </div>
          <div className="divide-y divide-[var(--c-border)]">
            {[...byDate.entries()].map(([dateStr, ads]) => (
              <div key={dateStr} className="px-4 py-3">
                <p className="text-[11px] font-semibold text-[var(--c-text-muted)] uppercase tracking-wider mb-2">{dateStr}</p>
                <div className="space-y-1.5">
                  {ads.map(ad => (
                    <div key={ad.id} className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E54D42] shrink-0" />
                      <span className="text-[12px] text-[var(--c-text-secondary)]">
                        {ad.checkedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[12px] text-[var(--c-text-muted)]">·</span>
                      <span className="text-[12px] text-[var(--c-text-muted)]">{ad.keyword}</span>
                      {ad.position && (
                        <>
                          <span className="text-[12px] text-[var(--c-text-muted)]">·</span>
                          <span className="text-[12px] text-[var(--c-text-muted)]">position {ad.position}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
