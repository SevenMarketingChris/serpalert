'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { AuctionInsight } from '@/lib/db/schema'

const NEON_COLORS = [
  'oklch(62% 0.32 340)',  // pink
  'oklch(72% 0.22 200)',  // cyan
  'oklch(78% 0.28 130)',  // lime
  'oklch(58% 0.28 280)',  // purple
  'oklch(78% 0.22 80)',   // amber
  'oklch(68% 0.25 160)',  // teal
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
          tick={{ fontSize: 11, fill: 'oklch(58% 0.025 280)' }}
          axisLine={{ stroke: 'oklch(18% 0.04 280)' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={v => `${v}%`}
          tick={{ fontSize: 11, fill: 'oklch(58% 0.025 280)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v) => `${Number(v).toFixed(1)}%`}
          contentStyle={{
            background: 'oklch(9% 0.025 280)',
            border: '1px solid oklch(18% 0.04 280)',
            borderRadius: '0.5rem',
            fontSize: '12px',
            color: 'oklch(96% 0.005 280)',
          }}
          labelStyle={{ color: 'oklch(72% 0.22 200)', fontFamily: 'monospace' }}
        />
        <Legend
          wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
        />
        {domains.map((d, i) => (
          <Line
            key={d}
            type="monotone"
            dataKey={d}
            stroke={NEON_COLORS[i % NEON_COLORS.length]}
            dot={false}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
