import { Badge } from '@/components/ui/badge'
import { AdCopyCard } from './ad-copy-card'
import { ScreenshotModal } from './screenshot-modal'
import type { SerpCheck, CompetitorAd } from '@/lib/db/schema'

type CheckWithAds = SerpCheck & { ads: CompetitorAd[] }

export function CompetitorTimeline({ checks }: { checks: CheckWithAds[] }) {
  if (checks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No SERP checks yet — data will appear after the first scheduled check.
      </p>
    )
  }

  return (
    <div className="divide-y divide-border">
      {checks.map(check => {
        const hasCompetitors = check.competitorCount > 0
        return (
          <div
            key={check.id}
            className={`p-4 card-neon-hover ${hasCompetitors ? 'neon-bar-pink' : 'neon-bar-green'}`}
          >
            <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
              {/* Timestamp */}
              <span className="font-mono text-xs text-muted-foreground whitespace-nowrap shrink-0 pt-0.5">
                {new Date(check.checkedAt).toLocaleString('en-GB')}
              </span>

              {/* Keyword */}
              <span className="text-sm font-medium shrink-0">{check.keyword}</span>

              {/* Result badge */}
              {hasCompetitors ? (
                <Badge variant="destructive" className="shrink-0">
                  {check.competitorCount} found
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="shrink-0 text-neon-green border-neon-green/40 bg-neon-green/5"
                >
                  None
                </Badge>
              )}

              {/* Screenshot trigger */}
              <div className="ml-auto shrink-0">
                <ScreenshotModal screenshotUrl={check.screenshotUrl} keyword={check.keyword} />
              </div>
            </div>

            {/* Competitor domain pills */}
            {check.ads.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[...new Set(check.ads.map(a => a.domain))].map(domain => (
                  <span
                    key={domain}
                    className="bg-secondary text-neon-cyan border border-neon-cyan/20 font-mono text-xs rounded px-1.5 py-0.5"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            )}

            {/* Ad copy cards */}
            {check.ads.length > 0 && (
              <div className="mt-3">
                <AdCopyCard ads={check.ads} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
