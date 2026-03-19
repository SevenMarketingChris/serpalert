'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'

const PLANS = [
  { id: 'starter', name: 'Starter', price: 29 },
  { id: 'professional', name: 'Professional', price: 79 },
  { id: 'agency', name: 'Agency', price: 199 },
] as const

type PlanId = (typeof PLANS)[number]['id']

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
  const [plan, setPlan] = useState<PlanId>('starter')

  const results = useMemo(() => {
    const planCost = PLANS.find(p => p.id === plan)!.price
    const competitorFreeFrac = competitorFreePct / 100

    // Monthly PPC savings from pausing on competitor-free days
    const monthlyPpcSavings = monthlySpend * competitorFreeFrac

    // Monthly brand revenue
    const monthlyRevenue = monthlySpend * brandRoas

    // Revenue at risk — organic captures ~75% of brand searches when pausing
    // so only 25% of revenue is at risk on competitor-free days
    const monthlyRevenueAtRisk = monthlyRevenue * competitorFreeFrac * 0.25

    // Net gains
    const monthlyGrossGain = monthlyPpcSavings - monthlyRevenueAtRisk
    const netMonthly = monthlyGrossGain - planCost
    const netAnnual = netMonthly * 12
    const annualCost = planCost * 12

    // ROI % based on net annual gain vs subscription cost
    const roi = annualCost > 0 ? (netAnnual / annualCost) * 100 : 0

    // Payback in days — how long until the monthly subscription cost is covered
    const dailyGrossGain = monthlyGrossGain / 30
    const paybackDays = dailyGrossGain > 0
      ? Math.ceil(planCost / dailyGrossGain)
      : null

    return {
      monthlyPpcSavings,
      monthlyRevenueAtRisk,
      monthlyGrossGain,
      netMonthly,
      netAnnual,
      annualCost,
      roi,
      paybackDays,
      planCost,
      monthlyClicks: avgCpc > 0 ? Math.round(monthlySpend / avgCpc) : 0,
    }
  }, [monthlySpend, avgCpc, brandRoas, competitorFreePct, plan])

  const isPositive = results.netAnnual > 0

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Inputs */}
      <Card className="border-border">
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground font-mono mb-4">Your Numbers</h3>
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
                value={brandRoas} min={1} max={30} step={0.5}
                suffix="×" onChange={setBrandRoas}
              />
              <SliderInput
                label="Days per month with no competitor bidding"
                hint="Industry average is 60% — most brands overspend on brand PPC unnecessarily"
                value={competitorFreePct} min={10} max={90} step={5}
                suffix="%" onChange={setCompetitorFreePct}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground font-mono mb-3">SerpAlert Plan</h3>
            <div className="grid grid-cols-3 gap-2">
              {PLANS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  className={`rounded-lg border px-3 py-2.5 text-center text-xs font-medium transition-all ${
                    plan === p.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:border-primary/50 hover:bg-muted'
                  }`}
                >
                  <div>{p.name}</div>
                  <div className="font-mono font-bold mt-0.5">£{p.price}/mo</div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {/* Headline result */}
        <Card className={`border-border ${isPositive ? 'metric-stripe-green' : 'metric-stripe-orange'}`}>
          <CardContent className="p-6 text-center space-y-1">
            <p className="text-xs uppercase tracking-widest font-mono text-muted-foreground">Net Annual Saving</p>
            <p className={`text-5xl font-black ${isPositive ? 'text-tech-green' : 'text-tech-orange'}`}>
              {isPositive ? fmt(results.netAnnual) : `-${fmt(Math.abs(results.netAnnual))}`}
            </p>
            {results.paybackDays !== null && results.paybackDays <= 365 && isPositive && (
              <p className="text-sm text-muted-foreground">
                SerpAlert pays for itself in <span className="font-semibold text-foreground">{results.paybackDays} day{results.paybackDays !== 1 ? 's' : ''}</span>
              </p>
            )}
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
              <p className="text-xl font-black text-tech-cyan mt-1">{fmt(results.netMonthly)}</p>
            </CardContent>
          </Card>
          <Card className="metric-stripe-purple border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-mono">ROI</p>
              <p className="text-xl font-black text-tech-purple mt-1">{Math.round(results.roi)}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">on subscription cost</p>
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
              You only risk <span className="text-foreground font-semibold">{fmt(results.monthlyRevenueAtRisk)}/mo</span> in revenue — because organic search still captures ~75% of brand clicks when you pause.
            </p>
            <p>
              Minus <span className="text-foreground font-semibold">£{results.planCost}/mo</span> for SerpAlert = <span className="font-semibold text-primary">{fmt(results.netMonthly)}/mo net gain</span>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
