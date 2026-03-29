'use client'

import { useState } from 'react'

function formatFull(value: number): string {
  return `£${value.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`
}

export function BudgetCalculator() {
  const [brandSpend, setBrandSpend] = useState(2000)
  const [brandRoas, setBrandRoas] = useState(10)
  const [nonBrandRoas, setNonBrandRoas] = useState(6)
  const [retentionRate, setRetentionRate] = useState(80)

  const currentBrandRevenue = brandSpend * brandRoas
  const retainedRevenue = currentBrandRevenue * (retentionRate / 100)
  const lostRevenue = currentBrandRevenue - retainedRevenue
  const newAcquisitionRevenue = brandSpend * nonBrandRoas
  const netMonthlyGain = newAcquisitionRevenue - lostRevenue
  const netAnnualGain = netMonthlyGain * 12
  const isPositive = netMonthlyGain > 0
  const isBreakeven = Math.abs(netMonthlyGain) < 50
  const currentTotalRevenue = currentBrandRevenue
  const newTotalRevenue = retainedRevenue + newAcquisitionRevenue

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Inputs */}
        <div className="space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-400 font-mono">
            Your numbers
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white">Monthly brand campaign spend</label>
              <span className="font-mono text-sm font-bold text-emerald-400">{formatFull(brandSpend)}</span>
            </div>
            <input type="range" min={500} max={20000} step={250} value={brandSpend}
              onChange={(e) => setBrandSpend(Number(e.target.value))}
              className="w-full accent-emerald-500" />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>£500</span><span>£20,000</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white">Current brand ROAS</label>
              <span className="font-mono text-sm font-bold text-emerald-400">{brandRoas}x</span>
            </div>
            <input type="range" min={2} max={30} step={1} value={brandRoas}
              onChange={(e) => setBrandRoas(Number(e.target.value))}
              className="w-full accent-emerald-500" />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>2x</span><span>30x</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Brand ROAS is typically 8-15x because customers already know you.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white">Expected non-brand ROAS</label>
              <span className="font-mono text-sm font-bold text-emerald-400">{nonBrandRoas}x</span>
            </div>
            <input type="range" min={1} max={15} step={0.5} value={nonBrandRoas}
              onChange={(e) => setNonBrandRoas(Number(e.target.value))}
              className="w-full accent-emerald-500" />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1x</span><span>15x</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Non-brand campaigns target new customers. Typical ROAS is 3-8x.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white">Brand traffic retained organically</label>
              <span className="font-mono text-sm font-bold text-emerald-400">{retentionRate}%</span>
            </div>
            <input type="range" min={50} max={95} step={5} value={retentionRate}
              onChange={(e) => setRetentionRate(Number(e.target.value))}
              className="w-full accent-emerald-500" />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>50%</span><span>95%</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Studies show 70-90% of brand clicks go to the organic listing anyway.
            </p>
          </div>
        </div>

        {/* Right: Results */}
        <div className="space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-400 font-mono">
            The result
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#0F1729] border border-white/5 p-4 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">Current monthly revenue</p>
              <p className="text-2xl font-bold font-mono text-white">{formatFull(currentTotalRevenue)}</p>
              <p className="text-[11px] text-slate-500">from {formatFull(brandSpend)}/mo at {brandRoas}x ROAS</p>
            </div>
            <div className="rounded-xl bg-[#0F1729] border border-white/5 p-4 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">Projected monthly revenue</p>
              <p className={`text-2xl font-bold font-mono ${newTotalRevenue >= currentTotalRevenue ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatFull(newTotalRevenue)}
              </p>
              <p className="text-[11px] text-slate-500">organic + new customer revenue</p>
            </div>
          </div>

          <div className="rounded-xl bg-[#0F1729] border border-white/5 divide-y divide-white/5">
            <div className="px-4 py-2.5">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">How it breaks down</p>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-sm text-white">Brand revenue kept via organic</span>
                <p className="text-[11px] text-slate-500">{retentionRate}% of customers find you without ads</p>
              </div>
              <span className="font-mono text-sm text-white">{formatFull(retainedRevenue)}</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-sm text-white">Brand revenue lost</span>
                <p className="text-[11px] text-slate-500">{100 - retentionRate}% who only click ads, not organic</p>
              </div>
              <span className="font-mono text-sm text-red-400">-{formatFull(lostRevenue)}</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-sm text-white">New customer revenue gained</span>
                <p className="text-[11px] text-slate-500">{formatFull(brandSpend)} redirected at {nonBrandRoas}x ROAS</p>
              </div>
              <span className="font-mono text-sm text-emerald-400">+{formatFull(newAcquisitionRevenue)}</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between bg-white/[0.03]">
              <span className="text-sm font-semibold text-white">Net monthly impact</span>
              <span className={`font-mono text-sm font-bold ${isPositive ? 'text-emerald-400' : isBreakeven ? 'text-white' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{formatFull(netMonthlyGain)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width verdict */}
      <div className={`rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 ${
        isPositive
          ? 'bg-emerald-500/10 border border-emerald-500/20'
          : isBreakeven
            ? 'bg-white/5 border border-white/10'
            : 'bg-red-500/10 border border-red-500/20'
      }`}>
        <div className="p-8 text-center space-y-2 md:border-r border-inherit flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">Annual impact</p>
          <p className={`text-5xl font-extrabold font-mono ${
            isPositive ? 'text-emerald-400' : isBreakeven ? 'text-white' : 'text-red-400'
          }`}>
            {isPositive ? '+' : ''}{formatFull(netAnnualGain)}
          </p>
          <p className="text-sm text-slate-500">
            {isPositive ? 'additional revenue per year' : isBreakeven ? 'roughly break-even annually' : 'less revenue per year'}
          </p>
        </div>

        <div className="p-8 flex flex-col justify-center">
          {isPositive ? (
            <div className="space-y-3">
              <p className="font-bold text-lg text-emerald-400">The maths works in your favour.</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                You&apos;d gain {formatFull(newAcquisitionRevenue)}/mo in new customer revenue while only
                losing {formatFull(lostRevenue)}/mo in brand traffic. SerpAlert monitors hourly so you can
                switch defence back on within 60 minutes.
              </p>
            </div>
          ) : isBreakeven ? (
            <div className="space-y-3">
              <p className="font-bold text-lg text-white">It&apos;s close to break-even.</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Consider testing with a reduced brand budget first, or focus on improving your non-brand
                ROAS before making the full switch.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="font-bold text-lg text-amber-400">Keep your brand campaigns running.</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                With {brandRoas}x brand ROAS and only {nonBrandRoas}x non-brand, the revenue lost
                ({formatFull(lostRevenue)}/mo) outweighs gains ({formatFull(newAcquisitionRevenue)}/mo).
                Focus on improving non-brand ROAS first.
              </p>
            </div>
          )}
        </div>
      </div>

      <details className="text-xs text-slate-500">
        <summary className="cursor-pointer font-mono uppercase tracking-widest hover:text-slate-300 transition-colors">
          Assumptions & methodology
        </summary>
        <div className="mt-3 space-y-2 pl-4 border-l-2 border-white/10">
          <p><strong className="text-slate-400">Brand retention rate:</strong> 70-90% for established brands (Google/Bing research). New brands may retain less.</p>
          <p><strong className="text-slate-400">Non-brand ROAS:</strong> E-commerce averages 4-8x, lead-gen 3-6x. Varies by industry.</p>
          <p><strong className="text-slate-400">Not accounted for:</strong> Competitor brand bidding (which SerpAlert monitors), seasonal variation, or brand visibility value.</p>
          <p><strong className="text-slate-400">Recommendation:</strong> Test gradually. Reduce brand spend by 50% first, monitor for 2-4 weeks, then decide.</p>
        </div>
      </details>
    </div>
  )
}
