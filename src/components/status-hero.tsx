import { ManualCheckButton } from '@/components/manual-check-button'

interface StatusHeroProps {
  brandId: string
  threatsToday: number
  lastCheckAt: Date | null
  isAdmin?: boolean
}

function getRelativeTime(date: Date | null): string {
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

export function StatusHero({ brandId, threatsToday, lastCheckAt, isAdmin }: StatusHeroProps) {
  const isProtected = threatsToday === 0
  const relativeTime = getRelativeTime(lastCheckAt)

  if (isProtected) {
    return (
      <div
        className="rounded-xl p-4 flex items-center justify-between gap-4 neon-glow-hero"
        style={{
          background: 'linear-gradient(135deg, oklch(25% 0.08 155), oklch(14% 0.025 250))',
          border: '1px solid oklch(55% 0.18 155 / 0.3)',
          boxShadow: '0 0 20px oklch(55% 0.18 155 / 0.08)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'oklch(30% 0.1 155 / 0.5)' }}
          >
            🛡
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: 'oklch(75% 0.18 155)' }}>
              BRAND PROTECTED
            </p>
            <p className="text-xs text-muted-foreground">
              No competitors detected in last 24h &middot; {relativeTime}
            </p>
          </div>
        </div>
        <ManualCheckButton brandId={brandId} />
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-4 flex items-center justify-between gap-4"
      style={{
        background: 'linear-gradient(135deg, oklch(25% 0.08 15), oklch(14% 0.025 250))',
        border: '1px solid oklch(52% 0.22 15 / 0.3)',
        boxShadow: '0 0 20px oklch(52% 0.22 15 / 0.08)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: 'oklch(30% 0.12 15 / 0.5)' }}
        >
          ⚠
        </div>
        <div>
          <p className="text-lg font-bold" style={{ color: 'oklch(65% 0.22 15)' }}>
            {threatsToday} THREAT{threatsToday !== 1 ? 'S' : ''} DETECTED
          </p>
          <p className="text-xs text-muted-foreground">
            {threatsToday} competitor{threatsToday !== 1 ? 's' : ''} bidding on your brand &middot; {relativeTime}
          </p>
        </div>
      </div>
      <ManualCheckButton brandId={brandId} />
    </div>
  )
}
