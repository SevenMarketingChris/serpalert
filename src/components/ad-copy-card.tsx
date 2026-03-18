import { Badge } from '@/components/ui/badge'
import type { CompetitorAd } from '@/lib/db/schema'

export function AdCopyCard({ ads }: { ads: CompetitorAd[] }) {
  if (ads.length === 0) return null
  return (
    <div className="space-y-2">
      {ads.map(ad => (
        <div key={ad.id} className="bg-card border border-border rounded-lg p-3 neon-bar-cyan card-neon-hover">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="destructive" className="text-xs shrink-0">Ad</Badge>
            <span className="text-neon-pink text-xs font-mono truncate">{ad.displayUrl ?? ad.domain}</span>
            {ad.position != null && (
              <span className="ml-auto font-mono text-xs text-neon-amber shrink-0">#{ad.position}</span>
            )}
          </div>
          <p className="text-neon-cyan font-semibold text-sm leading-snug">{ad.headline}</p>
          {ad.description && (
            <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{ad.description}</p>
          )}
        </div>
      ))}
    </div>
  )
}
