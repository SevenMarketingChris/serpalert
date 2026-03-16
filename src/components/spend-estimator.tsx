'use client'
import { useState } from 'react'
import type { AuctionInsight } from '@/lib/db/schema'

type Props = {
  brandId: string
  initialAvgCpc: string | null
  initialMonthlySearches: number | null
  auctionInsights: AuctionInsight[]
}

export function SpendEstimator({ brandId, initialAvgCpc, initialMonthlySearches, auctionInsights }: Props) {
  const [cpc, setCpc] = useState(initialAvgCpc ?? '')
  const [searches, setSearches] = useState(initialMonthlySearches?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const cpcNum = parseFloat(cpc)
  const searchesNum = parseInt(searches)
  const hasValues = !isNaN(cpcNum) && cpcNum > 0 && !isNaN(searchesNum) && searchesNum > 0

  const save = async () => {
    setSaving(true)
    await fetch(`/api/brands/${brandId}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avgBrandCpc: hasValues ? cpcNum : null, monthlyBrandSearches: hasValues ? searchesNum : null }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // Get latest impression share per competitor domain
  const latestByDomain = new Map<string, number>()
  for (const insight of auctionInsights) {
    if (!latestByDomain.has(insight.competitorDomain) && insight.impressionShare) {
      latestByDomain.set(insight.competitorDomain, parseFloat(insight.impressionShare))
    }
  }

  const estimates = [...latestByDomain.entries()]
    .map(([domain, share]) => ({
      domain,
      impressionShare: share,
      estimatedMonthlySpend: hasValues ? Math.round(share * searchesNum * cpcNum) : null,
    }))
    .sort((a, b) => b.impressionShare - a.impressionShare)

  const fmt = (n: number) => `£${n.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-[11px] font-medium text-[var(--c-text-muted)] uppercase tracking-wider mb-1.5">
            Avg brand keyword CPC
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-text-muted)] text-[13px]">£</span>
            <input
              type="number"
              step="0.01"
              value={cpc}
              onChange={e => setCpc(e.target.value)}
              placeholder="1.20"
              className="w-full bg-[var(--c-card-secondary)] border border-[var(--c-border)] rounded-lg pl-7 pr-3 py-2 text-[13px] text-[var(--c-text)] placeholder-[var(--c-text-faint)] focus:outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/20 transition-all"
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-[11px] font-medium text-[var(--c-text-muted)] uppercase tracking-wider mb-1.5">
            Monthly brand searches
          </label>
          <input
            type="number"
            value={searches}
            onChange={e => setSearches(e.target.value)}
            placeholder="5000"
            className="w-full bg-[var(--c-card-secondary)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[13px] text-[var(--c-text)] placeholder-[var(--c-text-faint)] focus:outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/20 transition-all"
          />
        </div>
        <button
          onClick={save}
          disabled={saving || !hasValues}
          className="px-4 py-2 bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20 hover:bg-[#FF6B35]/20 text-[13px] font-medium rounded-lg transition-colors disabled:opacity-40 whitespace-nowrap"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
        </button>
      </div>

      {latestByDomain.size === 0 && (
        <div className="flex items-center gap-2 p-4 bg-[var(--c-card-secondary)] rounded-lg border border-[var(--c-border)]">
          <p className="text-[12px] text-[var(--c-text-muted)]">
            Competitor spend estimates will appear here once Google Ads Auction Insights data has been imported.
          </p>
        </div>
      )}

      {estimates.length > 0 && (
        <div className="border border-[var(--c-border)] rounded-lg overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[var(--c-card-secondary)] border-b border-[var(--c-border)]">
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-[var(--c-text-muted)] uppercase tracking-wider">Competitor</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-[var(--c-text-muted)] uppercase tracking-wider">Impression Share</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-[var(--c-text-muted)] uppercase tracking-wider">Est. Monthly Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-border)]">
              {estimates.map(e => (
                <tr key={e.domain} className="bg-[var(--c-card)]">
                  <td className="px-3 py-2.5 font-medium text-[var(--c-text)]">{e.domain}</td>
                  <td className="px-3 py-2.5 text-[var(--c-text-secondary)]">{Math.round(e.impressionShare * 100)}%</td>
                  <td className="px-3 py-2.5">
                    {e.estimatedMonthlySpend != null ? (
                      <span className="font-semibold text-[#E54D42]">{fmt(e.estimatedMonthlySpend)}</span>
                    ) : (
                      <span className="text-[var(--c-text-muted)]">Enter CPC + searches above</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasValues && estimates.length > 0 && (
        <p className="text-[11px] text-[var(--c-text-muted)] px-0.5">
          Estimated using: impression share × {searchesNum.toLocaleString()} monthly searches × {fmt(cpcNum)} avg CPC.
          Actual spend may vary — use as a directional benchmark.
        </p>
      )}
    </div>
  )
}
