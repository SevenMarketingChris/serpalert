'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { AuctionInsight } from '@/lib/db/schema'

const TECH_COLORS = [
  "oklch(50% 0.22 250)",   // tech blue
  "oklch(55% 0.18 200)",   // cyan
  "oklch(52% 0.20 145)",   // green
  "oklch(52% 0.20 280)",   // purple
  "oklch(62% 0.18 60)",    // amber
  "oklch(55% 0.18 170)",   // teal
]

export function AuctionChart({ insights }: { insights: AuctionInsight[] }) {
  if (insights.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No auction data yet.</p>
  }
  const domains = [...new Set(insights.map(i => i.competitorDomain))]
  const byDate = insights.reduce((acc, i) => {
    const d = String(i.date)
    if (!acc[d]) acc[d] = { date: d }
    acc[d][i.competitorDomain] = Number(i.impressionShare ?? 0) * 100
    return acc
  }, {} as Record<string, Record<string, number | string>>)
  const data = Object.values(byDate).sort((a, b) => String(a.date).localeCompare(String(b.date)))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'oklch(45% 0.02 250)' }}
          axisLine={{ stroke: 'oklch(88% 0.01 250)' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={v => `${v}%`}
          tick={{ fontSize: 11, fill: 'oklch(45% 0.02 250)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v) => `${Number(v).toFixed(1)}%`}
          contentStyle={{
            background: 'var(--color-card, white)',
            color: 'var(--color-card-foreground, black)',
            border: '1px solid var(--color-border, #eee)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelStyle={{ color: 'oklch(50% 0.22 250)', fontFamily: 'monospace' }}
        />
        <Legend
          wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
        />
        {domains.map((d, i) => (
          <Line
            key={d}
            type="monotone"
            dataKey={d}
            stroke={TECH_COLORS[i % TECH_COLORS.length]}
            dot={false}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
