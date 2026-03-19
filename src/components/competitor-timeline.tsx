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
            className={`p-4 ${hasCompetitors ? 'border-l-2 border-l-destructive/50' : ''}`}
          >
            {/* Row 1: timestamp, keyword, status, screenshot */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                {new Date(check.checkedAt).toLocaleString('en-GB', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </span>
              <span className="text-sm font-medium">{check.keyword}</span>
              {hasCompetitors ? (
                <Badge variant="destructive">
                  {check.competitorCount} competitor{check.competitorCount !== 1 ? 's' : ''}
                </Badge>
              ) : (
                <span className="text-xs text-tech-green font-mono">Clear</span>
              )}
              {check.screenshotUrl && (
                <div className="ml-auto">
                  <ScreenshotModal screenshotUrl={check.screenshotUrl} keyword={check.keyword} />
                </div>
              )}
            </div>

            {/* Row 2: competitor domains */}
            {check.ads.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 ml-0">
                {check.ads
                  .map(a => a.domain)
                  .filter((d, i, arr) => arr.indexOf(d) === i)
                  .map(domain => (
                  <span
                    key={domain}
                    className="bg-destructive/5 text-destructive border border-destructive/20 font-mono text-xs rounded px-2 py-0.5"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            )}

            {/* Row 3: ad copy details */}
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
