'use client'

interface TrendChartProps {
  data: { date: string; checks: number; threats: number }[]
}

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) return null

  const maxValue = Math.max(...data.map(d => Math.max(d.checks, d.threats)), 1)

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-4">
        30-Day Activity
      </h3>
      <div className="flex items-end gap-px h-20">
        {data.map((day) => {
          const checkHeight = Math.max((day.checks / maxValue) * 100, 4)
          const threatHeight = day.threats > 0 ? Math.max((day.threats / maxValue) * 100, 4) : 0
          return (
            <div
              key={day.date}
              className="flex-1 group relative flex flex-col justify-end"
              title={`${day.date}: ${day.checks} checks, ${day.threats} threats`}
            >
              <div
                className={`w-full rounded-sm ${day.threats > 0 ? 'bg-red-500' : 'bg-primary/30 group-hover:bg-primary/50'}`}
                style={{ height: `${day.threats > 0 ? Math.max(checkHeight, threatHeight) : checkHeight}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-mono">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
      <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-primary/30" /> Checks
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-red-500" /> Threats detected
        </span>
      </div>
    </div>
  )
}
