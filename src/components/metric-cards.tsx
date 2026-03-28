interface MetricCardsProps {
  checksToday: number
  threatsToday: number
  keywordCount: number
  last7DaysThreats: number[]
  monthlySpend?: string | null
  brandRoas?: string | null
  isAdmin?: boolean
}

const BLOCKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']

function buildSparkline(data: number[]): string {
  const padded = data.length < 7
    ? [...Array(7 - data.length).fill(0), ...data]
    : data.slice(-7)
  const max = Math.max(...padded)
  if (max === 0) return '▁▁▁▁▁▁▁'
  return padded
    .map(v => BLOCKS[Math.min(Math.round((v / max) * 7), 7)])
    .join('')
}

export function MetricCards({
  checksToday,
  threatsToday,
  keywordCount,
  last7DaysThreats,
  monthlySpend,
  brandRoas,
  isAdmin,
}: MetricCardsProps) {
  const sparkline = buildSparkline(last7DaysThreats)
  const threatIsZero = threatsToday === 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Checks Today */}
      <div className="bg-card border border-border rounded-lg p-3.5 metric-stripe-blue">
        <p className="text-[9px] uppercase tracking-[1.5px] font-mono text-muted-foreground mb-1">
          Checks Today
        </p>
        <p className="text-2xl font-bold font-mono text-tech-blue">{checksToday}</p>
      </div>

      {/* Threats Today */}
      <div
        className={`bg-card border border-border rounded-lg p-3.5 ${threatIsZero ? 'metric-stripe-green' : 'border-t-3 border-t-red-500'}`}
      >
        <p className="text-[9px] uppercase tracking-[1.5px] font-mono text-muted-foreground mb-1">
          Threats Today
        </p>
        <p
          className={`text-2xl font-bold font-mono ${threatIsZero ? 'text-tech-green' : 'text-red-500'}`}
        >
          {threatsToday}
        </p>
      </div>

      {/* Keywords */}
      <div className="bg-card border border-border rounded-lg p-3.5 metric-stripe-purple">
        <p className="text-[9px] uppercase tracking-[1.5px] font-mono text-muted-foreground mb-1">
          Keywords
        </p>
        <p className="text-2xl font-bold font-mono text-tech-purple">{keywordCount}</p>
      </div>

      {/* 7d Trend */}
      <div className="bg-card border border-border rounded-lg p-3.5 metric-stripe-orange">
        <p className="text-[9px] uppercase tracking-[1.5px] font-mono text-muted-foreground mb-1">
          7d Trend
        </p>
        <p className="text-2xl font-bold font-mono text-tech-orange">{sparkline}</p>
      </div>

      {/* Admin: Monthly Spend */}
      {isAdmin && monthlySpend && (
        <div className="bg-card border border-border rounded-lg p-3.5 metric-stripe-blue">
          <p className="text-[9px] uppercase tracking-[1.5px] font-mono text-muted-foreground mb-1">
            Monthly Spend
          </p>
          <p className="text-2xl font-bold font-mono text-tech-blue">
            £{parseFloat(monthlySpend).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
          </p>
        </div>
      )}

      {/* Admin: Brand ROAS */}
      {isAdmin && brandRoas && (
        <div className="bg-card border border-border rounded-lg p-3.5 metric-stripe-cyan">
          <p className="text-[9px] uppercase tracking-[1.5px] font-mono text-muted-foreground mb-1">
            Brand ROAS
          </p>
          <p className="text-2xl font-bold font-mono text-tech-cyan">
            {parseFloat(brandRoas).toFixed(1)}x
          </p>
        </div>
      )}
    </div>
  )
}
