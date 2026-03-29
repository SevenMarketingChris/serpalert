import { ShieldCheck, AlertTriangle } from 'lucide-react'
import { ManualCheckButton } from '@/components/manual-check-button'

interface StatusHeroProps {
  brandId: string
  threatsToday: number
  lastCheckAt: string | null
  isAdmin?: boolean
  showCheckButton?: boolean
  checksToday?: number
  keywordCount?: number
  last7DaysThreats?: number[]
}

function getRelativeTime(date: string | null): string {
  if (!date) return 'No checks yet'
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Last check just now'
  if (diffMin < 60) return `Last check ${diffMin} min ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `Last check ${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `Last check ${diffDays}d ago`
}

const BLOCKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
function buildSparkline(data: number[]): string {
  const padded = data.length < 7 ? [...Array(7 - data.length).fill(0), ...data] : data.slice(-7)
  const max = Math.max(...padded)
  if (max === 0) return '▁▁▁▁▁▁▁'
  return padded.map(v => BLOCKS[Math.min(Math.round((v / max) * 7), 7)]).join('')
}

export function StatusHero({
  brandId, threatsToday, lastCheckAt, isAdmin, showCheckButton = true,
  checksToday = 0, keywordCount = 0, last7DaysThreats = [],
}: StatusHeroProps) {
  const isProtected = threatsToday === 0
  const relativeTime = getRelativeTime(lastCheckAt)
  const sparkline = buildSparkline(last7DaysThreats)

  return (
    <div className={`rounded-xl overflow-hidden ${
      isProtected
        ? 'bg-emerald-500/10 border border-emerald-500/30'
        : 'bg-red-500/10 border border-red-500/30'
    }`}>
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
            isProtected ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'
          }`}>
            {isProtected
              ? <ShieldCheck className="w-5 h-5" />
              : <AlertTriangle className="w-5 h-5" />
            }
          </div>
          <div>
            <p className={`text-lg font-bold ${isProtected ? 'text-emerald-500' : 'text-red-500'}`}>
              {isProtected
                ? 'BRAND PROTECTED'
                : `${threatsToday} THREAT${threatsToday !== 1 ? 'S' : ''} DETECTED`}
            </p>
            <p className="text-xs text-muted-foreground">
              {isProtected
                ? `No competitors detected in last 24h · ${relativeTime}`
                : `${threatsToday} competitor${threatsToday !== 1 ? 's' : ''} bidding on your brand · ${relativeTime}`}
            </p>
          </div>
        </div>
        {showCheckButton && <ManualCheckButton brandId={brandId} />}
      </div>

      {(checksToday > 0 || keywordCount > 0) && (
        <div className="border-t border-border/30 px-4 py-2.5 flex items-center gap-x-6 gap-y-2 flex-wrap text-xs">
          <div>
            <span className="text-muted-foreground">Checks today</span>
            <span className="ml-1.5 font-mono font-bold text-foreground">{checksToday}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Keywords</span>
            <span className="ml-1.5 font-mono font-bold text-foreground">{keywordCount}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Threats today</span>
            <span className={`ml-1.5 font-mono font-bold ${threatsToday > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {threatsToday}
            </span>
          </div>
          {last7DaysThreats.length > 0 && (
            <div>
              <span className="text-muted-foreground">7d trend</span>
              <span className="ml-1.5 font-mono text-foreground">{sparkline}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
