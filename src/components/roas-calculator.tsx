'use client'
import { useState } from 'react'

type Props = {
  brandId: string
  initialSpend: string | null
  initialRoas: string | null
  competitorChecks30d: number   // checks with competitors in last 30 days
  totalChecks30d: number        // total checks in last 30 days
}

function Recommendation({ spend, roas, competitorChecks, totalChecks }: {
  spend: number; roas: number; competitorChecks: number; totalChecks: number
}) {
  if (totalChecks === 0) return (
    <div className="flex items-start gap-2.5 p-4 bg-[var(--c-card-secondary)] rounded-lg border border-[var(--c-border)]">
      <div className="w-1.5 h-1.5 rounded-full bg-[var(--c-text-muted)] mt-1.5 shrink-0" />
      <p className="text-[13px] text-[var(--c-text-muted)]">No scan data yet. Run a check to generate a recommendation.</p>
    </div>
  )

  const exposureRate = competitorChecks / totalChecks
  const monthlyRevenue = spend * roas
  const fmt = (n: number) => `£${n.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`

  if (exposureRate === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2.5 p-4 bg-[#59D499]/6 rounded-lg border border-[#59D499]/20">
          <div className="w-1.5 h-1.5 rounded-full bg-[#59D499] mt-1.5 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-[#59D499]">No competitors found in 30 days — brand campaign may be unnecessary</p>
            <p className="text-[12px] text-[#59D499]/70 mt-1">
              0 out of {totalChecks} scans detected a competitor bidding on your brand terms.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-lg p-3">
            <p className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider mb-1">Potential monthly saving</p>
            <p className="text-[22px] font-semibold text-[#59D499] tabular-nums">{fmt(spend)}</p>
            <p className="text-[11px] text-[var(--c-text-muted)] mt-0.5">if brand campaign is paused</p>
          </div>
          <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-lg p-3">
            <p className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider mb-1">Revenue at risk</p>
            <p className="text-[22px] font-semibold text-[var(--c-text)] tabular-nums">{fmt(monthlyRevenue)}</p>
            <p className="text-[11px] text-[var(--c-text-muted)] mt-0.5">estimated brand traffic value</p>
          </div>
        </div>
        <p className="text-[11px] text-[var(--c-text-muted)] px-1">
          Note: branded traffic often converts without paid ads. Consider a pause test — pause for 2 weeks and monitor direct/organic revenue.
        </p>
      </div>
    )
  }

  if (exposureRate < 0.15) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2.5 p-4 bg-[#FFB340]/6 rounded-lg border border-[#FFB340]/20">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FFB340] mt-1.5 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-[#FFB340]">Low competitor activity — consider reducing budget</p>
            <p className="text-[12px] text-[#FFB340]/70 mt-1">
              {competitorChecks} of {totalChecks} scans ({Math.round(exposureRate * 100)}%) detected competitors in the last 30 days.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-lg p-3">
            <p className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider mb-1">Monthly spend</p>
            <p className="text-[20px] font-semibold text-[var(--c-text)] tabular-nums">{fmt(spend)}</p>
          </div>
          <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-lg p-3">
            <p className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider mb-1">Protected revenue</p>
            <p className="text-[20px] font-semibold text-[var(--c-text)] tabular-nums">{fmt(monthlyRevenue)}</p>
          </div>
          <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-lg p-3">
            <p className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider mb-1">Exposure rate</p>
            <p className="text-[20px] font-semibold text-[#FFB340] tabular-nums">{Math.round(exposureRate * 100)}%</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5 p-4 bg-[#E54D42]/6 rounded-lg border border-[#E54D42]/20">
        <div className="w-1.5 h-1.5 rounded-full bg-[#E54D42] mt-1.5 shrink-0" />
        <div>
          <p className="text-[13px] font-semibold text-[#E54D42]">Competitors actively bidding — brand campaign is justified</p>
          <p className="text-[12px] text-[#E54D42]/70 mt-1">
            {competitorChecks} of {totalChecks} scans ({Math.round(exposureRate * 100)}%) detected competitors in the last 30 days.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-lg p-3">
          <p className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider mb-1">Monthly spend</p>
          <p className="text-[20px] font-semibold text-[var(--c-text)] tabular-nums">{fmt(spend)}</p>
          <p className="text-[11px] text-[var(--c-text-muted)] mt-0.5">defending brand terms</p>
        </div>
        <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-lg p-3">
          <p className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider mb-1">Revenue protected</p>
          <p className="text-[20px] font-semibold text-[#59D499] tabular-nums">{fmt(monthlyRevenue)}</p>
          <p className="text-[11px] text-[var(--c-text-muted)] mt-0.5">at {roas}× ROAS</p>
        </div>
        <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-lg p-3">
          <p className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider mb-1">Return on defence</p>
          <p className="text-[20px] font-semibold text-[var(--c-text)] tabular-nums">{fmt(monthlyRevenue - spend)}</p>
          <p className="text-[11px] text-[var(--c-text-muted)] mt-0.5">net value of campaign</p>
        </div>
      </div>
    </div>
  )
}

export function RoasCalculator({ brandId, initialSpend, initialRoas, competitorChecks30d, totalChecks30d }: Props) {
  const [spend, setSpend] = useState(initialSpend ?? '')
  const [roas, setRoas] = useState(initialRoas ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const spendNum = parseFloat(spend)
  const roasNum = parseFloat(roas)
  const hasValues = !isNaN(spendNum) && spendNum > 0 && !isNaN(roasNum) && roasNum > 0

  const save = async () => {
    setSaving(true)
    await fetch(`/api/brands/${brandId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monthlyBrandSpend: hasValues ? spendNum : null,
        brandRoas: hasValues ? roasNum : null,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-[11px] font-medium text-[var(--c-text-muted)] uppercase tracking-wider mb-1.5">
            Monthly brand keyword spend
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-text-muted)] text-[13px]">£</span>
            <input
              type="number"
              value={spend}
              onChange={e => setSpend(e.target.value)}
              placeholder="1500"
              className="w-full bg-[#141414] border border-[var(--c-border)] rounded-lg pl-7 pr-3 py-2 text-[14px] text-[var(--c-text)] placeholder-[var(--c-text-faint)] focus:outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/20 transition-all"
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-[11px] font-medium text-[var(--c-text-muted)] uppercase tracking-wider mb-1.5">
            Brand campaign ROAS
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={roas}
              onChange={e => setRoas(e.target.value)}
              placeholder="4.5"
              className="w-full bg-[#141414] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[14px] text-[var(--c-text)] placeholder-[var(--c-text-faint)] focus:outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/20 transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-text-muted)] text-[13px]">×</span>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving || !hasValues}
          className="px-4 py-2 bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20 hover:bg-[#FF6B35]/20 text-[13px] font-medium rounded-lg transition-colors disabled:opacity-40 whitespace-nowrap"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
        </button>
      </div>

      {hasValues && (
        <Recommendation
          spend={spendNum}
          roas={roasNum}
          competitorChecks={competitorChecks30d}
          totalChecks={totalChecks30d}
        />
      )}

      {!hasValues && (
        <div className="flex items-center gap-2 p-4 bg-[var(--c-card-secondary)] rounded-lg border border-[var(--c-border)]">
          <svg className="w-4 h-4 text-[var(--c-text-muted)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[12px] text-[var(--c-text-muted)]">
            Enter the monthly Google Ads spend and ROAS for this brand&apos;s branded campaigns to get a recommendation on whether to keep them running.
          </p>
        </div>
      )}
    </div>
  )
}
