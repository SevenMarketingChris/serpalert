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
    <div className="space-y-0">
      {checks.map(check => {
        const hasCompetitors = check.competitorCount > 0
        return (
          <div
            key={check.id}
            className={`bg-card border border-border rounded-lg p-4 mb-3 tech-card-hover ${hasCompetitors ? 'border-l-2 border-l-destructive/50' : 'border-l-2 border-l-primary/40'}`}
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
                  className="shrink-0 text-tech-green border-primary/20"
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
                {check.ads
                  .map(a => a.domain)
                  .filter((d, i, arr) => arr.indexOf(d) === i)
                  .map(domain => (
                  <span
                    key={domain}
                    className="bg-primary/8 text-primary border border-primary/20 font-mono text-xs rounded px-2 py-0.5"
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
