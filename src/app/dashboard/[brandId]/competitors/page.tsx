import { notFound } from 'next/navigation'
import { getBrandById, getCompetitorSummaryForBrand } from '@/lib/db/queries'
import { DashboardTabs } from '@/components/dashboard-tabs'
import { Shield } from 'lucide-react'
import { WastedSpendBadge } from '@/components/wasted-spend-badge'
import { getRelativeTime } from '@/lib/time'

const rankBorderColors: Record<number, string> = {
  1: '#D4AF37',
  2: '#A8A9AD',
  3: '#CD7F32',
}

export default async function CompetitorsPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params
  const brand = await getBrandById(brandId)
  if (!brand) notFound()

  const competitors = await getCompetitorSummaryForBrand(brandId)

  return (
    <div className="max-w-5xl space-y-4">
      <DashboardTabs brandId={brandId} hasGoogleAds={!!brand.googleAdsCustomerId} />

      {competitors.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
            <Shield className="h-6 w-6" />
          </div>
          <p className="font-semibold text-foreground">No competitors detected yet</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            When competitors start bidding on your brand keywords, they&apos;ll appear here with full details.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">Rank</th>
                  <th className="px-4 py-3 font-medium">Domain</th>
                  <th className="px-4 py-3 font-medium">Avg Position</th>
                  <th className="px-4 py-3 font-medium">Last 30d</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Keywords</th>
                  <th className="px-4 py-3 font-medium">First Seen</th>
                  <th className="px-4 py-3 font-medium">Last Seen</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((competitor, index) => {
                  const rank = index + 1
                  const borderColor = rankBorderColors[rank]
                  return (
                    <tr
                      key={competitor.domain}
                      className="border-b border-border last:border-b-0 hover:bg-card/80 transition-colors"
                      style={borderColor ? { borderLeftWidth: '3px', borderLeftColor: borderColor } : undefined}
                    >
                      <td className="px-4 py-3 text-sm text-muted-foreground">#{rank}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-bold">{competitor.domain}</span>
                        <WastedSpendBadge detections={competitor.recentCount} avgPosition={competitor.avgPosition} />
                      </td>
                      <td className="px-4 py-3">
                        {competitor.avgPosition != null ? (
                          <span className={`font-mono text-xs px-2 py-0.5 rounded ${
                            competitor.avgPosition <= 2 ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground'
                          }`}>
                            Pos {competitor.avgPosition}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">&mdash;</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-sm">{competitor.recentCount}</td>
                      <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{competitor.totalCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {competitor.keywords.slice(0, 3).map((kw) => (
                            <span
                              key={kw}
                              className="bg-tech-purple/10 text-tech-purple text-xs font-mono px-2 py-0.5 rounded"
                            >
                              {kw}
                            </span>
                          ))}
                          {competitor.keywords.length > 3 && (
                            <span className="text-muted-foreground text-xs">
                              +{competitor.keywords.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {new Date(competitor.firstSeen).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {getRelativeTime(competitor.lastSeen)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${competitor.isActive ? 'bg-emerald-500' : 'bg-muted-foreground'}`}
                          />
                          {competitor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {competitors.map((competitor, index) => (
              <div
                key={competitor.domain}
                className="bg-card border border-border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm">{competitor.domain}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${competitor.isActive ? 'bg-emerald-500' : 'bg-muted-foreground'}`}
                    />
                    {competitor.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    <span className="font-mono font-bold text-foreground">{competitor.recentCount}</span> last 30d
                    <span className="mx-1">&middot;</span>
                    <span className="font-mono text-foreground">{competitor.totalCount}</span> total
                  </span>
                  <span className="font-mono text-xs">{getRelativeTime(competitor.lastSeen)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
