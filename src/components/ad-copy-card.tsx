import { Badge } from '@/components/ui/badge'
import type { CompetitorAd } from '@/lib/db/schema'

export function AdCopyCard({ ads }: { ads: CompetitorAd[] }) {
  if (ads.length === 0) return null
  return (
    <div className="space-y-2">
      {ads.map(ad => (
        <div key={ad.id} className="bg-card border border-border rounded-lg p-3 tech-card-hover border-l-2 border-l-primary/60">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="destructive" className="text-xs shrink-0">Ad</Badge>
            <span className="text-muted-foreground text-xs font-mono truncate">{ad.displayUrl ?? ad.domain}</span>
            {ad.position != null && (
              <span className="ml-auto font-mono text-xs text-tech-orange shrink-0">#{ad.position}</span>
            )}
          </div>
          <p className="text-primary font-semibold text-sm leading-snug">{ad.headline}</p>
          {ad.description && (
            <p className="text-foreground/70 text-xs mt-1 leading-relaxed">{ad.description}</p>
          )}
        </div>
      ))}
    </div>
  )
}
