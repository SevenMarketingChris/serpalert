'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'

function fmt(n: number) {
  return '£' + Math.round(n).toLocaleString('en-GB')
}

function SliderInput({
  label, hint, value, min, max, step, prefix, suffix, onChange,
}: {
  label: string; hint?: string; value: number; min: number; max: number; step: number
  prefix?: string; suffix?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="font-mono text-sm font-semibold text-primary">
          {prefix}{value.toLocaleString('en-GB')}{suffix}
        </span>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-border accent-primary"
      />
      <div className="flex justify-between text-xs text-muted-foreground font-mono">
        <span>{prefix}{min.toLocaleString()}{suffix}</span>
        <span>{prefix}{max.toLocaleString()}{suffix}</span>
      </div>
    </div>
  )
}

export function RoiCalculator() {
  const [monthlySpend, setMonthlySpend] = useState(2000)
  const [avgCpc, setAvgCpc] = useState(1.5)
  const [brandRoas, setBrandRoas] = useState(8)
  const [competitorFreePct, setCompetitorFreePct] = useState(60)

  const results = useMemo(() => {
    const competitorFreeFrac = competitorFreePct / 100

    // Monthly PPC savings from pausing on competitor-free days
    const monthlyPpcSavings = monthlySpend * competitorFreeFrac

    // Monthly brand revenue
    const monthlyRevenue = monthlySpend * brandRoas

    // Revenue at risk — organic captures ~75% of brand searches when pausing
    // so only 25% of revenue is at risk on competitor-free days
    const monthlyRevenueAtRisk = monthlyRevenue * competitorFreeFrac * 0.25

    // Net gains (savings minus revenue risk — no subscription cost factored in)
    const monthlyNetGain = monthlyPpcSavings - monthlyRevenueAtRisk
    const annualNetGain = monthlyNetGain * 12

    // Saving rate — net gain as % of total brand PPC spend
    const savingRate = monthlySpend > 0 ? (monthlyNetGain / monthlySpend) * 100 : 0

    return {
      monthlyPpcSavings,
      monthlyRevenueAtRisk,
      monthlyNetGain,
      annualNetGain,
      savingRate,
      monthlyClicks: avgCpc > 0 ? Math.round(monthlySpend / avgCpc) : 0,
    }
  }, [monthlySpend, avgCpc, brandRoas, competitorFreePct])

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Inputs */}
      <Card className="border-border">
        <CardContent className="p-6 space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground font-mono">Your Numbers</h3>
          <div className="space-y-6">
            <SliderInput
              label="Monthly brand PPC spend"
              hint="How much you currently spend on branded keywords per month"
              value={monthlySpend} min={100} max={20000} step={100}
              prefix="£" onChange={setMonthlySpend}
            />
            <SliderInput
              label="Average CPC on brand keywords"
              hint={`≈ ${results.monthlyClicks.toLocaleString()} brand clicks/month`}
              value={avgCpc} min={0.1} max={10} step={0.1}
              prefix="£" onChange={setAvgCpc}
            />
            <SliderInput
              label="Brand ROAS"
              hint="Revenue generated per £1 spent on brand PPC (e.g. 8 = £8 revenue per £1 spent)"
              value={brandRoas} min={1} max={50} step={0.5}
              suffix="×" onChange={setBrandRoas}
            />
            <SliderInput
              label="Days per month with no competitor bidding"
              hint="Industry average is 60% — most brands overspend on brand PPC unnecessarily"
              value={competitorFreePct} min={10} max={90} step={5}
              suffix="%" onChange={setCompetitorFreePct}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {/* Headline result */}
        <Card className="border-border metric-stripe-green">
          <CardContent className="p-6 text-center space-y-1">
            <p className="text-xs uppercase tracking-widest font-mono text-muted-foreground">Annual Net Saving</p>
            <p className="text-5xl font-black text-tech-green">{fmt(results.annualNetGain)}</p>
            <p className="text-sm text-muted-foreground">by pausing brand PPC when competitors aren&apos;t bidding</p>
          </CardContent>
        </Card>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="metric-stripe-blue border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-mono">PPC Saved/mo</p>
              <p className="text-xl font-black text-tech-blue mt-1">{fmt(results.monthlyPpcSavings)}</p>
            </CardContent>
          </Card>
          <Card className="metric-stripe-orange border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-mono">Revenue at Risk/mo</p>
              <p className="text-xl font-black text-tech-orange mt-1">{fmt(results.monthlyRevenueAtRisk)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">organic captures 75%</p>
            </CardContent>
          </Card>
          <Card className="metric-stripe-cyan border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-mono">Net Gain/mo</p>
              <p className="text-xl font-black text-tech-cyan mt-1">{fmt(results.monthlyNetGain)}</p>
            </CardContent>
          </Card>
          <Card className="metric-stripe-purple border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-mono">Saving Rate</p>
              <p className="text-xl font-black text-tech-purple mt-1">{Math.round(results.savingRate)}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">of total brand spend</p>
            </CardContent>
          </Card>
        </div>

        {/* Explanation */}
        <Card className="border-border bg-muted/30">
          <CardContent className="p-4 text-xs text-muted-foreground space-y-1 font-mono">
            <p>
              You save <span className="text-foreground font-semibold">{fmt(results.monthlyPpcSavings)}/mo</span> in PPC costs by pausing on competitor-free days.
            </p>
            <p>
              You only risk <span className="text-foreground font-semibold">{fmt(results.monthlyRevenueAtRisk)}/mo</span> in revenue — organic search still captures ~75% of brand clicks when you pause.
            </p>
            <p>
              That&apos;s a net gain of <span className="font-semibold text-primary">{fmt(results.monthlyNetGain)}/mo</span>, or <span className="font-semibold text-primary">{fmt(results.annualNetGain)}/year</span>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
