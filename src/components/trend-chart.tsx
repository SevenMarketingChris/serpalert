'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface TrendChartProps {
  data: { date: string; checks: number; threats: number }[]
}

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) return null

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-4 shadow-lg shadow-gray-200/20">
      <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-mono mb-4">
        30-Day Activity
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barCategoryGap="15%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#9ca3af' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            interval={4}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              fontFamily: 'monospace',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              backgroundColor: '#fff',
            }}
          />
          <Bar dataKey="checks" fill="#c7d2fe" radius={[2, 2, 0, 0]} name="Checks" />
          <Bar dataKey="threats" fill="#f87171" radius={[2, 2, 0, 0]} name="Threats" />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-indigo-200" /> Checks
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-red-400" /> Threats detected
        </span>
      </div>
    </div>
  )
}
