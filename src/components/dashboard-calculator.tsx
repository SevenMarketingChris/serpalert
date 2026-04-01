'use client'

import { useState } from 'react'
import { Calculator, TrendingUp, ArrowRight } from 'lucide-react'

function formatGBP(value: number): string {
  const abs = Math.abs(value)
  const formatted = `£${abs.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`
  return value < 0 ? `-${formatted}` : formatted
}

interface Props {
  initialBrandSpend?: number
  initialBrandRoas?: number
}

export function DashboardCalculator({ initialBrandSpend = 2000, initialBrandRoas = 10 }: Props) {
  const [brandSpend, setBrandSpend] = useState(initialBrandSpend)
  const [brandRoas, setBrandRoas] = useState(initialBrandRoas)
  const [nonBrandRoas, setNonBrandRoas] = useState(5)
  const [retentionRate, setRetentionRate] = useState(80)
  const [redirectCampaign, setRedirectCampaign] = useState('')

  // Calculations
  const currentBrandRevenue = brandSpend * brandRoas
  const retainedRevenue = currentBrandRevenue * (retentionRate / 100)
  const lostRevenue = currentBrandRevenue - retainedRevenue
  const newAcquisitionRevenue = brandSpend * nonBrandRoas
  const netMonthlyGain = newAcquisitionRevenue - lostRevenue
  const netAnnualGain = netMonthlyGain * 12
  const isPositive = netMonthlyGain > 50
  const isNegative = netMonthlyGain < -50
  const monthlySaving = brandSpend // The freed-up budget

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl shadow-lg shadow-gray-200/20 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100/50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Calculator className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Budget Redirect Calculator</h3>
          <p className="text-xs text-gray-500">See how much more revenue you could generate by redirecting brand spend</p>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Inputs */}
          <div className="space-y-5">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-mono font-semibold">Your numbers</p>

            {/* Brand spend */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="dc-brandSpend" className="text-sm font-medium text-gray-700">Monthly brand campaign spend</label>
                <span className="font-mono text-sm font-bold text-indigo-600">{formatGBP(brandSpend)}</span>
              </div>
              <input id="dc-brandSpend" type="range" min={500} max={20000} step={250} value={brandSpend}
                onChange={(e) => setBrandSpend(Number(e.target.value))}
                className="w-full accent-indigo-600" />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>£500</span><span>£20,000</span>
              </div>
            </div>

            {/* Brand ROAS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="dc-brandRoas" className="text-sm font-medium text-gray-700">Current brand ROAS</label>
                <span className="font-mono text-sm font-bold text-indigo-600">{brandRoas}x</span>
              </div>
              <input id="dc-brandRoas" type="range" min={2} max={30} step={1} value={brandRoas}
                onChange={(e) => setBrandRoas(Number(e.target.value))}
                className="w-full accent-indigo-600" />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>2x</span><span>30x</span>
              </div>
              <p className="text-[11px] text-gray-400">Brand ROAS is typically 8-15x because customers already know you.</p>
            </div>

            {/* Redirect campaign */}
            <div className="space-y-2">
              <label htmlFor="dc-campaign" className="text-sm font-medium text-gray-700">Where will you redirect the budget?</label>
              <select
                id="dc-campaign"
                value={redirectCampaign}
                onChange={(e) => setRedirectCampaign(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
              >
                <option value="">Select campaign type...</option>
                <option value="non-brand-search">Non-brand search (new keywords)</option>
                <option value="shopping">Shopping / Product Listing Ads</option>
                <option value="performance-max">Performance Max</option>
                <option value="display">Display / Remarketing</option>
                <option value="social">Social Ads (Meta, LinkedIn)</option>
                <option value="other">Other acquisition campaign</option>
              </select>
              <p className="text-[11px] text-gray-400">
                The type of campaign helps estimate the expected ROAS for your redirected budget.
              </p>
            </div>

            {/* Non-brand ROAS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="dc-nonBrandRoas" className="text-sm font-medium text-gray-700">Expected ROAS on new campaign</label>
                <span className="font-mono text-sm font-bold text-indigo-600">{nonBrandRoas}x</span>
              </div>
              <input id="dc-nonBrandRoas" type="range" min={1} max={15} step={0.5} value={nonBrandRoas}
                onChange={(e) => setNonBrandRoas(Number(e.target.value))}
                className="w-full accent-indigo-600" />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>1x</span><span>15x</span>
              </div>
              <p className="text-[11px] text-gray-400">
                {redirectCampaign === 'non-brand-search' && 'Non-brand search typically returns 3-8x ROAS.'}
                {redirectCampaign === 'shopping' && 'Shopping campaigns typically return 4-10x ROAS.'}
                {redirectCampaign === 'performance-max' && 'Performance Max typically returns 3-7x ROAS.'}
                {redirectCampaign === 'display' && 'Display/remarketing typically returns 2-5x ROAS.'}
                {redirectCampaign === 'social' && 'Social ads typically return 2-6x ROAS.'}
                {redirectCampaign === 'other' && 'Varies by campaign — use your expected return.'}
                {!redirectCampaign && 'Select a campaign type above for benchmarks.'}
              </p>
            </div>

            {/* Retention rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="dc-retention" className="text-sm font-medium text-gray-700">Brand traffic retained organically</label>
                <span className="font-mono text-sm font-bold text-indigo-600">{retentionRate}%</span>
              </div>
              <input id="dc-retention" type="range" min={50} max={95} step={5} value={retentionRate}
                onChange={(e) => setRetentionRate(Number(e.target.value))}
                className="w-full accent-indigo-600" />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>50%</span><span>95%</span>
              </div>
              <p className="text-[11px] text-gray-400">
                Research shows 70-90% of brand ad clicks would have gone to organic anyway.
              </p>
            </div>
          </div>

          {/* Right: Results */}
          <div className="space-y-5">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-mono font-semibold">Projected impact</p>

            {/* Flow diagram */}
            <div className="space-y-3">
              <div className="bg-gray-50/70 rounded-xl p-4 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-mono">Current brand revenue</p>
                <p className="text-xl font-bold font-mono text-gray-900">{formatGBP(currentBrandRevenue)}</p>
                <p className="text-[11px] text-gray-400">{formatGBP(brandSpend)}/mo at {brandRoas}x ROAS</p>
              </div>

              <div className="flex items-center gap-2 px-4">
                <ArrowRight className="w-4 h-4 text-indigo-400" />
                <p className="text-xs text-gray-500">Redirect {formatGBP(monthlySaving)}/mo to {redirectCampaign ? redirectCampaign.replace(/-/g, ' ') : 'new campaigns'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50/70 rounded-xl p-4 space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-mono">Retained organically</p>
                  <p className="text-lg font-bold font-mono text-emerald-700">{formatGBP(retainedRevenue)}</p>
                  <p className="text-[11px] text-emerald-500">{retentionRate}% of brand clicks stay</p>
                </div>
                <div className="bg-red-50/70 rounded-xl p-4 space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-red-400 font-mono">Revenue at risk</p>
                  <p className="text-lg font-bold font-mono text-red-600">{formatGBP(lostRevenue)}</p>
                  <p className="text-[11px] text-red-400">{100 - retentionRate}% may go elsewhere</p>
                </div>
              </div>

              <div className="bg-indigo-50/70 rounded-xl p-4 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-mono">New revenue from redirected budget</p>
                <p className="text-xl font-bold font-mono text-indigo-700">{formatGBP(newAcquisitionRevenue)}</p>
                <p className="text-[11px] text-indigo-400">{formatGBP(monthlySaving)} × {nonBrandRoas}x ROAS{redirectCampaign ? ` (${redirectCampaign.replace(/-/g, ' ')})` : ''}</p>
              </div>
            </div>

            {/* Net impact */}
            <div className={`rounded-xl p-5 space-y-2 ${
              isPositive
                ? 'bg-emerald-50/70 border border-emerald-200/50'
                : isNegative
                  ? 'bg-amber-50/70 border border-amber-200/50'
                  : 'bg-gray-50/70 border border-gray-200/50'
            }`}>
              <div className="flex items-center gap-2">
                <TrendingUp className={`w-5 h-5 ${isPositive ? 'text-emerald-600' : isNegative ? 'text-amber-600' : 'text-gray-500'}`} />
                <p className={`text-[10px] uppercase tracking-widest font-mono font-semibold ${isPositive ? 'text-emerald-600' : isNegative ? 'text-amber-600' : 'text-gray-500'}`}>
                  Net monthly impact
                </p>
              </div>
              <p className={`text-3xl font-bold font-mono ${isPositive ? 'text-emerald-700' : isNegative ? 'text-amber-700' : 'text-gray-700'}`}>
                {isPositive ? '+' : ''}{formatGBP(netMonthlyGain)}
              </p>
              <p className={`text-sm ${isPositive ? 'text-emerald-600' : isNegative ? 'text-amber-600' : 'text-gray-500'}`}>
                {isPositive ? `+${formatGBP(netAnnualGain)} additional revenue per year` : ''}
                {isNegative ? `The maths suggests keeping your brand campaign running. The ROAS on brand is too strong to redirect.` : ''}
                {!isPositive && !isNegative ? 'Roughly break-even — consider other factors like brand visibility.' : ''}
              </p>
            </div>

            {/* Verdict */}
            <div className="bg-white/50 rounded-xl p-4 border border-gray-100/50">
              <p className="text-xs text-gray-500 leading-relaxed">
                {isPositive && (
                  <>
                    <strong className="text-emerald-700">Verdict: Redirect the budget.</strong> By turning off your brand campaign and redirecting {formatGBP(monthlySaving)}/mo into {redirectCampaign ? redirectCampaign.replace(/-/g, ' ') : 'acquisition campaigns'}, you could generate {formatGBP(netAnnualGain)} more revenue per year. SerpAlert will alert you if a competitor starts bidding, so you can re-enable brand defence instantly.
                  </>
                )}
                {isNegative && (
                  <>
                    <strong className="text-amber-700">Verdict: Keep the brand campaign running.</strong> Your brand ROAS of {brandRoas}x is strong enough that the lost revenue ({formatGBP(lostRevenue)}/mo) outweighs what you&apos;d gain from redirecting. SerpAlert is still protecting you by monitoring for competitors.
                  </>
                )}
                {!isPositive && !isNegative && (
                  <>
                    <strong className="text-gray-700">Verdict: It&apos;s a close call.</strong> The numbers are roughly break-even. Consider testing a partial budget redirect to see real-world results.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
