import { notFound } from 'next/navigation'
import { getBrandById, getCompetitorProfiles, getCompetitorAdHistory } from '@/lib/db/queries'
import { getLogoUrl } from '@/lib/logo'
import { computeThreatScore } from '@/lib/threat-score'
import { PrintButton } from '@/components/print-button'

export default async function EvidencePage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params
  const brand = await getBrandById(brandId)
  if (!brand) notFound()

  const profiles = await getCompetitorProfiles(brandId)
  const logoUrl = brand.logoUrl ?? getLogoUrl(brand.websiteUrl)
  const reportDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  // Fetch ad history for all competitors (cap at 5 competitors for evidence doc)
  const topProfiles = profiles
    .map(p => ({ ...p, threat: computeThreatScore(p, 0, brand.keywords.length) }))
    .sort((a, b) => b.totalAppearances - a.totalAppearances)
    .slice(0, 5)

  const adHistories = await Promise.all(
    topProfiles.map(p => getCompetitorAdHistory(brandId, p.domain).then(h => ({ domain: p.domain, ads: h.slice(0, 10) })))
  )

  // Get SERP screenshots for evidence — pull from checks that had competitor ads
  const hasLandingPages = adHistories.some(({ ads }) => ads.some(a => a.landingPageScreenshotUrl))

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { page-break-before: always; }
        }
        @media screen {
          .page-break { margin-top: 40px; padding-top: 40px; border-top: 2px dashed var(--c-border); }
        }
      `}</style>

      {/* Controls bar */}
      <div className="no-print" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--c-card)', borderBottom: '1px solid var(--c-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 24px',
      }}>
        <a href={`/dashboard/${brandId}`} style={{ color: 'var(--c-text-muted)', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to dashboard
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Evidence package · {reportDate}</span>
          <PrintButton />
        </div>
      </div>

      {/* Document */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 32px 64px', fontFamily: 'system-ui, sans-serif' }}>

        {/* Cover */}
        <div style={{ marginBottom: 40, paddingBottom: 32, borderBottom: '1px solid var(--c-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'contain', background: 'var(--c-card-secondary)', padding: 6 }} />
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--c-text)' }}>{brand.name}</h1>
              <p style={{ margin: '3px 0 0', fontSize: 14, color: 'var(--c-text-muted)' }}>Competitor Brand Bidding — Evidence Package</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: 10, padding: '12px 16px' }}>
              <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Competitors Detected</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#E54D42', lineHeight: 1 }}>{profiles.length}</p>
            </div>
            <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: 10, padding: '12px 16px' }}>
              <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Brand Variants Monitored</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--c-text)', lineHeight: 1 }}>{brand.keywords.length}</p>
            </div>
            <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: 10, padding: '12px 16px' }}>
              <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Report Date</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--c-text)', lineHeight: 1.2 }}>{reportDate}</p>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--c-card-secondary)', borderRadius: 8, border: '1px solid var(--c-border)' }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--c-text-muted)', lineHeight: 1.6 }}>
              This document contains evidence of competitor paid search activity on {brand.name}&apos;s branded search terms, collected via automated Google SERP monitoring 3 times per day. Each entry below is a direct capture from a live Google Ads auction.
            </p>
          </div>
        </div>

        {/* One section per competitor */}
        {adHistories.map(({ domain, ads }, idx) => {
          const profile = topProfiles.find(p => p.domain === domain)!
          const adsWithLandingPages = ads.filter(a => a.landingPageScreenshotUrl)
          const uniqueAds = [...new Map(ads.filter(a => a.headline).map(a => [a.headline, a])).values()]

          return (
            <div key={domain} className={idx > 0 ? 'page-break' : ''} style={{ marginBottom: 40 }}>
              {/* Competitor header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--c-card-secondary)', border: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--c-text)' }}>{domain}</h2>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--c-text-muted)' }}>
                    {profile.totalAppearances} appearances · First seen {profile.firstSeen.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · Last seen {profile.lastSeen.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div style={{ marginLeft: 'auto', background: `${profile.threat.color}18`, border: `1px solid ${profile.threat.color}40`, borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: profile.threat.color }}>
                  {profile.threat.label} Threat
                </div>
              </div>

              {/* Keywords targeted */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {profile.uniqueKeywords.map(kw => (
                  <span key={kw} style={{ background: 'var(--c-card-secondary)', border: '1px solid var(--c-border)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: 'var(--c-text-secondary)' }}>
                    {kw}
                  </span>
                ))}
              </div>

              {/* Ad copy evidence */}
              {uniqueAds.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Captured Ad Copy</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {uniqueAds.map(ad => (
                      <div key={ad.id} style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: 8, padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: 'white', background: '#4285F4', padding: '2px 5px', borderRadius: 4, marginTop: 1 }}>Ad</span>
                          <div style={{ minWidth: 0 }}>
                            {ad.displayUrl && <p style={{ margin: '0 0 3px', fontSize: 11, color: '#59D499' }}>{ad.displayUrl}</p>}
                            {ad.headline && <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 600, color: '#4285F4' }}>{ad.headline}</p>}
                            {ad.description && <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--c-text-secondary)', lineHeight: 1.5 }}>{ad.description}</p>}
                            <p style={{ margin: 0, fontSize: 10, color: 'var(--c-text-muted)' }}>
                              Keyword: {ad.keyword} · Detected: {ad.checkedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {ad.position ? ` · Position ${ad.position}` : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Landing page screenshots */}
              {adsWithLandingPages.length > 0 && (
                <div>
                  <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Landing Page Screenshots</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    {adsWithLandingPages.slice(0, 4).map(ad => (
                      <div key={ad.id} style={{ border: '1px solid var(--c-border)', borderRadius: 8, overflow: 'hidden' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ad.landingPageScreenshotUrl!}
                          alt={`Landing page — ${domain}`}
                          style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
                        />
                        <p style={{ margin: 0, padding: '6px 10px', fontSize: 10, color: 'var(--c-text-muted)', background: 'var(--c-card-secondary)' }}>
                          Captured {ad.checkedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Footer */}
        {!hasLandingPages && profiles.length > 0 && (
          <div style={{ marginTop: 8, padding: '10px 14px', background: 'var(--c-card-secondary)', borderRadius: 8, border: '1px solid var(--c-border)', marginBottom: 32 }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--c-text-muted)' }}>
              Landing page screenshots will be automatically captured on the next scan when new competitors are detected.
            </p>
          </div>
        )}

        <div style={{ paddingTop: 20, borderTop: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--c-text-muted)' }}>
            Generated {reportDate} · Monitored 3× daily via Google SERP scanning
          </p>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--c-text-muted)' }}>SerpAlert</p>
        </div>
      </div>
    </>
  )
}
