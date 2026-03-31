import Link from 'next/link'
import { getRelativeTime } from '@/lib/time'

interface Competitor {
  domain: string
  timesSeen: number
  keywords: number
  lastSeen: string
}

interface CompetitorSummaryProps {
  competitors: Competitor[]
  brandId: string
}

export function CompetitorSummary({ competitors, brandId }: CompetitorSummaryProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Top Competitors (30d)</h3>
        <Link
          href={`/dashboard/${brandId}/competitors`}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-mono"
        >
          View all &rarr;
        </Link>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-widest text-gray-400 font-mono border-b border-gray-100">
            <th className="px-4 py-2 font-medium">Domain</th>
            <th className="px-4 py-2 font-medium">Times Seen</th>
            <th className="px-4 py-2 font-medium">Keywords</th>
            <th className="px-4 py-2 font-medium">Last Seen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {competitors.map(c => (
            <tr key={c.domain} className="hover:bg-indigo-50/50 transition-colors group">
              <td className="px-4 py-2.5">
                <Link href={`/dashboard/${brandId}/competitors`} className="font-mono text-gray-900 group-hover:text-indigo-700 hover:underline">
                  {c.domain}
                </Link>
              </td>
              <td className="px-4 py-2.5 font-mono text-gray-700">{c.timesSeen}</td>
              <td className="px-4 py-2.5 font-mono text-gray-700">{c.keywords}</td>
              <td className="px-4 py-2.5 font-mono text-gray-400">{getRelativeTime(c.lastSeen)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
