'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type AhrefsDomainMetric = {
  id: string; brandId: string; domain: string; isBrandDomain: boolean; date: string
  domainRating: string | null; organicTraffic: number | null; organicKeywords: number | null
  referringDomains: number | null; backlinks: number | null; fetchedAt: Date
}

const TRAFFIC_COLOR = "oklch(55% 0.18 200)" // tech cyan

export function AhrefsHistoryChart({ history, domain }: { history: AhrefsDomainMetric[]; domain: string }) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No historical data yet.
      </p>
    )
  }

  const data = history
    .filter(h => h.organicTraffic != null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(h => ({
      date: h.date,
      'Organic Traffic': h.organicTraffic,
    }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          axisLine={{ stroke: 'var(--color-border)' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v) => Number(v).toLocaleString()}
          contentStyle={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.5rem',
            fontSize: '12px',
            color: 'var(--color-card-foreground)',
            boxShadow: '0 2px 8px oklch(0% 0 0 / 8%)',
          }}
          labelStyle={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}
        />
        <Legend
          wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
        />
        <Line
          type="monotone"
          dataKey="Organic Traffic"
          stroke={TRAFFIC_COLOR}
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
