import { ManualCheckButton } from '@/components/manual-check-button'

interface StatusHeroProps {
  brandId: string
  threatsToday: number
  lastCheckAt: string | null
  isAdmin?: boolean
  showCheckButton?: boolean
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

export function StatusHero({ brandId, threatsToday, lastCheckAt, isAdmin, showCheckButton = true }: StatusHeroProps) {
  const isProtected = threatsToday === 0
  const relativeTime = getRelativeTime(lastCheckAt)

  if (isProtected) {
    return (
      <div className="rounded-xl p-4 flex items-center justify-between gap-4 bg-emerald-500/10 border border-emerald-500/30">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg flex-shrink-0 bg-emerald-500/20">
            🛡
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-500">
              BRAND PROTECTED
            </p>
            <p className="text-xs text-muted-foreground">
              No competitors detected in last 24h &middot; {relativeTime}
            </p>
          </div>
        </div>
        {showCheckButton && <ManualCheckButton brandId={brandId} />}
      </div>
    )
  }

  return (
    <div className="rounded-xl p-4 flex items-center justify-between gap-4 bg-red-500/10 border border-red-500/30">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg flex-shrink-0 bg-red-500/20">
          ⚠
        </div>
        <div>
          <p className="text-lg font-bold text-red-500">
            {threatsToday} THREAT{threatsToday !== 1 ? 'S' : ''} DETECTED
          </p>
          <p className="text-xs text-muted-foreground">
            {threatsToday} competitor{threatsToday !== 1 ? 's' : ''} bidding on your brand &middot; {relativeTime}
          </p>
        </div>
      </div>
      {showCheckButton && <ManualCheckButton brandId={brandId} />}
    </div>
  )
}
