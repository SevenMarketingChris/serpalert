interface BudgetRedirectSummaryProps {
  monthlyBrandSpend: string | null
  brandRoas: string | null
  competitorCount: number
}

export function BudgetRedirectSummary({ monthlyBrandSpend, brandRoas, competitorCount }: BudgetRedirectSummaryProps) {
  if (!monthlyBrandSpend) return null

  const spend = parseFloat(monthlyBrandSpend)
  const roas = brandRoas ? parseFloat(brandRoas) : 10
  if (isNaN(spend) || spend <= 0) return null

  const retentionRate = 0.8
  const nonBrandRoas = 6
  const retainedRevenue = spend * roas * retentionRate
  const newRevenue = spend * nonBrandRoas
  const lostRevenue = spend * roas * (1 - retentionRate)
  const netGain = newRevenue - lostRevenue

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-3">
        Budget Redirect Estimate
      </h3>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-bold font-mono text-foreground">
            £{Math.round(spend).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground">Monthly brand spend</p>
        </div>
        <div>
          <p className="text-lg font-bold font-mono text-emerald-500">
            +£{Math.round(netGain).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground">Monthly gain if redirected</p>
        </div>
        <div>
          <p className="text-lg font-bold font-mono text-foreground">
            {competitorCount}
          </p>
          <p className="text-[10px] text-muted-foreground">Active competitors</p>
        </div>
      </div>
      {competitorCount === 0 && netGain > 0 && (
        <p className="text-xs text-emerald-600 mt-3 text-center">
          No competitors detected — safe to redirect brand spend to acquisition
        </p>
      )}
      {competitorCount > 0 && (
        <p className="text-xs text-amber-600 mt-3 text-center">
          Competitors active — brand campaign defence recommended
        </p>
      )}
    </div>
  )
}
