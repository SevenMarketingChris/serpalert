'use client'

interface SparklineBarsProps {
  data: number[]
}

export function SparklineBars({ data }: SparklineBarsProps) {
  const max = Math.max(...data, 1)

  return (
    <div className="flex items-end gap-[3px] h-8">
      {data.map((value, i) => {
        const height = Math.max((value / max) * 100, 8)
        return (
          <div
            key={i}
            className={`flex-1 rounded-sm ${value > 0 ? 'bg-red-400' : 'bg-indigo-200'}`}
            style={{ height: `${height}%` }}
            title={`${value} threat${value !== 1 ? 's' : ''}`}
          />
        )
      })}
    </div>
  )
}
