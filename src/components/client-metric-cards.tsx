interface ClientMetricCardsProps {
  keywordCount: number
  totalChecks: number
  todayThreats: number
  allTimeCompetitors: number
}

export function ClientMetricCards({
  keywordCount,
  totalChecks,
  todayThreats,
  allTimeCompetitors,
}: ClientMetricCardsProps) {
  const isClear = todayThreats === 0

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Keywords Monitored */}
      <div className="bg-card border border-border rounded-lg p-3.5 metric-stripe-purple">
        <p className="text-[9px] uppercase tracking-[1.5px] font-mono text-muted-foreground mb-1">
          Keywords
        </p>
        <p className="text-2xl font-bold font-mono text-tech-purple">{keywordCount}</p>
      </div>

      {/* Total Checks */}
      <div className="bg-card border border-border rounded-lg p-3.5 metric-stripe-blue">
        <p className="text-[9px] uppercase tracking-[1.5px] font-mono text-muted-foreground mb-1">
          Total Checks
        </p>
        <p className="text-2xl font-bold font-mono text-tech-blue">{totalChecks}</p>
      </div>

      {/* Today */}
      <div
        className={`bg-card border border-border rounded-lg p-3.5 ${isClear ? 'metric-stripe-green' : ''}`}
        style={!isClear ? { borderTop: '3px solid var(--color-destructive)' } : undefined}
      >
        <p className="text-[9px] uppercase tracking-[1.5px] font-mono text-muted-foreground mb-1">
          Today
        </p>
        <p
          className={`text-2xl font-bold font-mono ${isClear ? 'text-tech-green' : ''}`}
          style={!isClear ? { color: 'var(--color-destructive)' } : undefined}
        >
          {isClear ? 'Clear' : `${todayThreats} found`}
        </p>
      </div>

      {/* All-Time Competitors */}
      <div className="bg-card border border-border rounded-lg p-3.5 metric-stripe-orange">
        <p className="text-[9px] uppercase tracking-[1.5px] font-mono text-muted-foreground mb-1">
          Competitors
        </p>
        <p className="text-2xl font-bold font-mono text-tech-orange">{allTimeCompetitors}</p>
      </div>
    </div>
  )
}
