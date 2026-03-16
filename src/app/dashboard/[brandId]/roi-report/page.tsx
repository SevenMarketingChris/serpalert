'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { Brand } from '@/lib/db/schema'
import type { CompetitorProfile } from '@/lib/db/queries'
import type { ThreatScore } from '@/lib/threat-score'
import { computeThreatScore } from '@/lib/threat-score'

type AdSample = { id: string; headline: string | null; description: string | null; displayUrl: string | null }
type ReportData = {
  brand: Brand
  totalChecks30d: number
  checksWithCompetitors30d: number
  profiles: CompetitorProfile[]
  adSamples: Record<string, AdSample[]>
}

function getLogoUrl(websiteUrl: string | null): string | null {
  if (!websiteUrl) return null
  try {
    const { hostname } = new URL(websiteUrl)
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`
  } catch { return null }
}

function fmt(n: number) { return `£${n.toLocaleString('en-GB', { maximumFractionDigits: 0 })}` }
function pct(n: number) { return `${Math.round(n * 100)}%` }

function Verdict({ totalChecks, competitorChecks, spend, roas }: { totalChecks: number; competitorChecks: number; spend: number | null; roas: number | null }) {
  const hasFinancials = spend != null && roas != null && spend > 0 && roas > 0
  const exposureRate = totalChecks > 0 ? competitorChecks / totalChecks : 0

  if (totalChecks === 0) {
    return (
      <div style={{ background: 'var(--c-card-secondary)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '20px 24px' }}>
        <p style={{ color: 'var(--c-text-muted)', fontSize: 14, margin: 0 }}>No scan data available yet. Run your first check to generate this report.</p>
      </div>
    )
  }

  if (exposureRate === 0) {
    return (
      <div style={{ background: 'rgba(89,212,153,0.06)', border: '1px solid rgba(89,212,153,0.2)', borderRadius: 12, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(89,212,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#59D499" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p style={{ color: '#59D499', fontWeight: 700, fontSize: 17, margin: '0 0 4px' }}>No competitors detected — brand campaign may be unnecessary</p>
            <p style={{ color: 'rgba(89,212,153,0.7)', fontSize: 13, margin: 0 }}>
              0 of {totalChecks} scans found a competitor bidding on your brand terms in the last 30 days.
              {hasFinancials && <> Potential monthly saving of {fmt(spend!)} if the campaign is paused.</>}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (exposureRate < 0.15) {
    return (
      <div style={{ background: 'rgba(255,179,64,0.06)', border: '1px solid rgba(255,179,64,0.2)', borderRadius: 12, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,179,64,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#FFB340" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div>
            <p style={{ color: '#FFB340', fontWeight: 700, fontSize: 17, margin: '0 0 4px' }}>Low competitor activity — consider reducing budget</p>
            <p style={{ color: 'rgba(255,179,64,0.7)', fontSize: 13, margin: 0 }}>
              {competitorChecks} of {totalChecks} scans ({pct(exposureRate)}) detected competitors in the last 30 days.
              {hasFinancials && <> Current spend is {fmt(spend!)} per month protecting {fmt(spend! * roas!)} in estimated brand revenue.</>}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'rgba(229,77,66,0.06)', border: '1px solid rgba(229,77,66,0.2)', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(229,77,66,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#E54D42" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <div>
          <p style={{ color: '#E54D42', fontWeight: 700, fontSize: 17, margin: '0 0 4px' }}>Competitors actively bidding — brand campaign is justified</p>
          <p style={{ color: 'rgba(229,77,66,0.7)', fontSize: 13, margin: 0 }}>
            {competitorChecks} of {totalChecks} scans ({pct(exposureRate)}) detected active competitor ads in the last 30 days.
            {hasFinancials && <> {fmt(spend!)} monthly spend is protecting {fmt(spend! * roas!)} in brand revenue.</>}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RoiReportPage() {
  const { brandId } = useParams<{ brandId: string }>()
  const [data, setData] = useState<ReportData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/brands/${brandId}/roi-report`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setData)
      .catch(e => setError(String(e)))
  }, [brandId])

  if (error) return <div style={{ padding: 40, color: 'var(--c-text-muted)', fontSize: 14 }}>{error}</div>
  if (!data) return <div style={{ padding: 40, color: 'var(--c-text-muted)', fontSize: 14 }}>Loading report…</div>

  const { brand, totalChecks30d, checksWithCompetitors30d, profiles, adSamples } = data
  const logoUrl = brand.logoUrl ?? getLogoUrl(brand.websiteUrl)
  const spend = brand.monthlyBrandSpend ? parseFloat(brand.monthlyBrandSpend) : null
  const roas = brand.brandRoas ? parseFloat(brand.brandRoas) : null
  const exposureRate = totalChecks30d > 0 ? checksWithCompetitors30d / totalChecks30d : 0

  const profilesWithScores: (CompetitorProfile & { threat: ThreatScore })[] = profiles.map(p => ({
    ...p,
    threat: computeThreatScore(p, totalChecks30d, brand.keywords.length),
  })).sort((a, b) => b.threat.score - a.threat.score)

  const reportDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const periodStart = new Date(); periodStart.setDate(periodStart.getDate() - 30)
  const period = `${periodStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Print/back controls */}
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
        <button
          onClick={() => window.print()}
          style={{ background: 'var(--c-card-secondary)', border: '1px solid var(--c-border)', color: 'var(--c-text)', borderRadius: 8, padding: '6px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Print / Export PDF
        </button>
      </div>

      {/* Report body */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 32px 64px', fontFamily: 'system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--c-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'contain', background: 'var(--c-card-secondary)', padding: 4 }} />
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--c-text)' }}>{brand.name}</h1>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--c-text-muted)' }}>Brand Protection ROI Report</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--c-text-muted)' }}>Generated {reportDate}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--c-text-muted)' }}>Period: {period}</p>
          </div>
        </div>

        {/* Verdict */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recommendation</h2>
          <Verdict totalChecks={totalChecks30d} competitorChecks={checksWithCompetitors30d} spend={spend} roas={roas} />
        </div>

        {/* Key metrics */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Key Metrics — Last 30 Days</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Total Scans', value: totalChecks30d.toString(), sub: `${brand.keywords.length} keyword${brand.keywords.length !== 1 ? 's' : ''} monitored` },
              { label: 'Competitor Exposure', value: pct(exposureRate), sub: `${checksWithCompetitors30d} scans with ads` },
              { label: 'Active Competitors', value: profiles.filter(p => p.recentAppearances > 0).length.toString(), sub: `${profiles.length} total observed` },
              spend != null && roas != null
                ? { label: 'Revenue Protected', value: fmt(spend * roas), sub: `${fmt(spend)} spend at ${roas}× ROAS` }
                : { label: 'Monthly Spend', value: spend != null ? fmt(spend) : '—', sub: 'brand campaign' },
            ].map((m, i) => (
              <div key={i} style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: 10, padding: '14px 16px' }}>
                <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</p>
                <p style={{ margin: '0 0 2px', fontSize: 24, fontWeight: 700, color: 'var(--c-text)', lineHeight: 1 }}>{m.value}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--c-text-muted)' }}>{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Competitor threats */}
        {profilesWithScores.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Competitor Threat Analysis</h2>
            <div style={{ border: '1px solid var(--c-border)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--c-card-secondary)' }}>
                    {['Competitor', 'Threat', 'Appearances', 'Keywords Targeted', 'Last Seen', 'Trend'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--c-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--c-border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profilesWithScores.map((p, i) => (
                    <tr key={p.domain} style={{ background: i % 2 === 0 ? 'var(--c-card)' : 'var(--c-card-secondary)', borderBottom: i < profilesWithScores.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--c-text)' }}>{p.domain}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${p.threat.color}18`, border: `1px solid ${p.threat.color}40`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: p.threat.color }}>
                          {p.threat.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--c-text)' }}>{p.totalAppearances}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--c-text-secondary)' }}>{p.uniqueKeywords.slice(0, 2).join(', ')}{p.uniqueKeywords.length > 2 ? ` +${p.uniqueKeywords.length - 2}` : ''}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--c-text-secondary)' }}>{p.lastSeen.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {p.threat.isEscalating ? (
                          <span style={{ color: '#E54D42', fontSize: 11, fontWeight: 600 }}>↑ Escalating</span>
                        ) : p.recentAppearances === 0 ? (
                          <span style={{ color: 'var(--c-text-muted)', fontSize: 11 }}>Inactive</span>
                        ) : (
                          <span style={{ color: 'var(--c-text-muted)', fontSize: 11 }}>Stable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ad copy evidence */}
        {profilesWithScores.slice(0, 3).some(p => (adSamples[p.domain]?.length ?? 0) > 0) && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Captured Ad Copy — Top Competitors</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {profilesWithScores.slice(0, 3).map(p => {
                const ads = adSamples[p.domain] ?? []
                if (ads.length === 0) return null
                return (
                  <div key={p.domain}>
                    <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: 'var(--c-text-secondary)' }}>{p.domain}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {ads.slice(0, 2).map(ad => (
                        <div key={ad.id} style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: 8, padding: '12px 14px' }}>
                          {ad.displayUrl && <p style={{ margin: '0 0 4px', fontSize: 11, color: '#59D499' }}>{ad.displayUrl}</p>}
                          {ad.headline && <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#4285F4' }}>{ad.headline}</p>}
                          {ad.description && <p style={{ margin: 0, fontSize: 12, color: 'var(--c-text-secondary)', lineHeight: 1.5 }}>{ad.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Keywords monitored */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Brand Variants Monitored</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {brand.keywords.map(kw => (
              <span key={kw} style={{ background: 'var(--c-card-secondary)', border: '1px solid var(--c-border)', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: 'var(--c-text-secondary)' }}>{kw}</span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--c-text-muted)' }}>
            Monitored 3× daily via Google SERP scanning. Data reflects real-time competitor ad activity.
          </p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--c-text-muted)', fontWeight: 600 }}>SerpAlert</p>
        </div>
      </div>
    </>
  )
}
