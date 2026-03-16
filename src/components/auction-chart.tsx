'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { AuctionInsight } from '@/lib/db/schema'

const COLORS = ['#ff2d78', '#00d4ff', '#7c3aed', '#f59e0b', '#10b981', '#f97316']

export function AuctionChart({ insights }: { insights: AuctionInsight[] }) {
  if (insights.length === 0) {
    return <p className="text-sm text-[#555] text-center py-8">No auction data yet.</p>
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
    <ResponsiveContainer width="100%" height={280} style={{ background: 'transparent' }}>
      <LineChart data={data} style={{ background: 'transparent' }}>
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#555' }} axisLine={{ stroke: '#2a2a2a' }} tickLine={{ stroke: '#2a2a2a' }} />
        <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#555' }} axisLine={{ stroke: '#2a2a2a' }} tickLine={{ stroke: '#2a2a2a' }} />
        <Tooltip
          formatter={(v) => `${Number(v).toFixed(1)}%`}
          contentStyle={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#f0f0f0' }}
          labelStyle={{ color: '#999' }}
        />
        <Legend wrapperStyle={{ color: '#999' }} />
        {domains.map((d, i) => (
          <Line key={d} type="monotone" dataKey={d} stroke={COLORS[i % COLORS.length]} dot={false} strokeWidth={2} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
