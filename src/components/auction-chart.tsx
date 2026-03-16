'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { AuctionInsight } from '@/lib/db/schema'

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']

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
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
        <Legend />
        {domains.map((d, i) => (
          <Line key={d} type="monotone" dataKey={d} stroke={COLORS[i % COLORS.length]} dot={false} strokeWidth={2} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
