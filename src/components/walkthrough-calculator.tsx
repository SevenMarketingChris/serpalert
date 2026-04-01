'use client'

import { useState } from 'react'
import { emitClientAnalyticsEvent } from '@/lib/analytics/client'

function formatGBP(value: number): string {
  const abs = Math.abs(value)
  const formatted = `£${abs.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`
  return value < 0 ? `-${formatted}` : formatted
}

export function WalkthroughCalculator() {
  const [step, setStep] = useState(1)
  const [brandSpend, setBrandSpend] = useState(2000)
  const [wastageRate, setWastageRate] = useState(80)
  const [nonBrandRoas, setNonBrandRoas] = useState(5)

  const wastedAmount = brandSpend * (wastageRate / 100)
  const revenueFromReinvesting = wastedAmount * nonBrandRoas
  const netMonthlyImpact = revenueFromReinvesting - wastedAmount
  const annualProjection = netMonthlyImpact * 12
  const isPositive = netMonthlyImpact > 0
  const isNegative = netMonthlyImpact < 0

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Step 1 — Always visible */}
      <div className="rounded-xl bg-[#0F1729] border border-white/5 p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400 font-mono">1</span>
          <h3 className="text-lg font-semibold text-white">What do you spend monthly on brand campaigns?</h3>
        </div>
        <div className="space-y-2 pl-10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Monthly brand spend</span>
            <span className="font-mono text-lg font-bold text-emerald-400">{formatGBP(brandSpend)}</span>
          </div>
          <input
            type="range"
            min={500}
            max={20000}
            step={250}
            value={brandSpend}
            onChange={(e) => setBrandSpend(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>£500</span><span>£20,000</span>
          </div>
        </div>
        {step === 1 && (
          <div className="pl-10">
            <button
              onClick={() => {
                void emitClientAnalyticsEvent({
                  name: 'cta_clicked',
                  properties: {
                    placement: 'calculator_step_1_next',
                    ctaLabel: 'Next',
                    funnelStage: 'calculator_start',
                  },
                })
                setStep(2)
              }}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Step 2 — Wastage reveal */}
      {step >= 2 && (
        <div className="rounded-xl bg-[#0F1729] border border-white/5 p-6 md:p-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400 font-mono">2</span>
            <h3 className="text-lg font-semibold text-white">Here&apos;s what you&apos;re likely wasting</h3>
          </div>
          <div className="space-y-4 pl-10">
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">Wasted brand spend per month</p>
              <p className="text-3xl font-extrabold font-mono text-red-400 mt-1">{formatGBP(wastedAmount)}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Wastage rate</span>
                <span className="font-mono text-sm font-bold text-emerald-400">{wastageRate}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                step={5}
                value={wastageRate}
                onChange={(e) => setWastageRate(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>50%</span><span>95%</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Studies show 70-90% of brand clicks come through organically even without ads running.
              </p>
            </div>
          </div>
          {step === 2 && (
            <div className="pl-10">
              <button
                onClick={() => {
                  void emitClientAnalyticsEvent({
                    name: 'cta_clicked',
                    properties: {
                      placement: 'calculator_step_2_next',
                      ctaLabel: 'Next',
                      funnelStage: 'calculator_progress',
                    },
                  })
                  setStep(3)
                }}
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Non-brand reinvestment */}
      {step >= 3 && (
        <div className="rounded-xl bg-[#0F1729] border border-white/5 p-6 md:p-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400 font-mono">3</span>
            <h3 className="text-lg font-semibold text-white">What if you put that into non-brand campaigns?</h3>
          </div>
          <div className="space-y-4 pl-10">
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">Revenue from reinvesting</p>
              <p className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">{formatGBP(revenueFromReinvesting)}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Non-brand ROAS</span>
                <span className="font-mono text-sm font-bold text-emerald-400">{nonBrandRoas}x</span>
              </div>
              <input
                type="range"
                min={1}
                max={15}
                step={0.5}
                value={nonBrandRoas}
                onChange={(e) => setNonBrandRoas(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1x</span><span>15x</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Non-brand campaigns typically deliver 3-8x ROAS by targeting new customers actively searching for your products or services.
              </p>
            </div>
          </div>
          {step === 3 && (
            <div className="pl-10">
              <button
                onClick={() => {
                  void emitClientAnalyticsEvent({
                    name: 'cta_clicked',
                    properties: {
                      placement: 'calculator_step_3_complete',
                      ctaLabel: 'See full impact',
                      funnelStage: 'calculator_complete',
                    },
                  })
                  setStep(4)
                }}
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
              >
                See full impact
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 4 — Final impact */}
      {step >= 4 && (
        <div className="rounded-xl bg-[#0F1729] border border-white/5 p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400 font-mono">4</span>
            <h3 className="text-lg font-semibold text-white">Your full impact breakdown</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 pl-10">
            <div className="rounded-xl bg-[#0B1120] border border-white/5 p-4 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">Wasted brand spend/mo</p>
              <p className="text-2xl font-bold font-mono text-red-400">{formatGBP(wastedAmount)}</p>
            </div>
            <div className="rounded-xl bg-[#0B1120] border border-white/5 p-4 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">Revenue from non-brand</p>
              <p className="text-2xl font-bold font-mono text-emerald-400">{formatGBP(revenueFromReinvesting)}</p>
            </div>
            <div className="rounded-xl bg-[#0B1120] border border-white/5 p-4 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">Net monthly impact</p>
              <p className={`text-2xl font-bold font-mono ${isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-amber-400'}`}>
                {isPositive ? '+' : ''}{formatGBP(netMonthlyImpact)}
              </p>
            </div>
            <div className="rounded-xl bg-[#0B1120] border border-white/5 p-4 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">Annual projection</p>
              <p className={`text-2xl font-bold font-mono ${isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-amber-400'}`}>
                {isPositive ? '+' : ''}{formatGBP(annualProjection)}
              </p>
            </div>
          </div>

          {/* Verdict */}
          <div className={`ml-10 rounded-xl p-6 ${
            isPositive
              ? 'bg-emerald-500/10 border border-emerald-500/20'
              : isNegative
                ? 'bg-red-500/10 border border-red-500/20'
                : 'bg-amber-500/10 border border-amber-500/20'
          }`}>
            {isPositive ? (
              <div className="space-y-2">
                <p className="font-bold text-lg text-emerald-400">Stop defending. Start growing.</p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Redirecting {formatGBP(wastedAmount)}/mo could generate {formatGBP(annualProjection)} in new revenue this year.
                  Your brand spend is holding you back — that budget belongs in campaigns that win new customers, not defend existing ones.
                </p>
              </div>
            ) : isNegative ? (
              <div className="space-y-2">
                <p className="font-bold text-lg text-red-400">Focus on improving non-brand ROAS first.</p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  At {nonBrandRoas}x non-brand ROAS, the numbers don&apos;t stack up yet.
                  Work on improving your non-brand campaign efficiency, then revisit the switch.
                  SerpAlert can still save you money by monitoring for competitors so you only bid when you need to.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-bold text-lg text-amber-400">You&apos;re at breakeven — test carefully.</p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Consider reducing brand spend by 50% first and monitoring results for 2-4 weeks.
                  SerpAlert gives you the safety net to experiment confidently.
                </p>
              </div>
            )}
          </div>

          {/* Reset */}
          <div className="pl-10">
            <button
              onClick={() => {
                setStep(1)
                setBrandSpend(2000)
                setWastageRate(80)
                setNonBrandRoas(5)
              }}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors font-mono uppercase tracking-widest"
            >
              Reset calculator
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
