import Link from 'next/link'
import { getAllActiveBrands, getLastCheckForBrand } from '@/lib/db/queries'
import type { Brand, SerpCheck } from '@/lib/db/schema'
import { ThemeToggle } from '@/components/theme-toggle'

const planColors: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  starter: 'bg-blue-500/10 text-blue-500',
  professional: 'bg-purple-500/10 text-purple-500',
  agency: 'bg-orange-500/10 text-orange-500',
}

export default async function DashboardPage() {
  const brands: Brand[] = await getAllActiveBrands()

  // Fetch last check for each brand
  const lastChecks = await Promise.all(
    brands.map(async (b) => {
      const check = await getLastCheckForBrand(b.id)
      return { brandId: b.id, check }
    })
  )
  const checkMap = new Map<string, SerpCheck | null>(
    lastChecks.map(({ brandId, check }) => [brandId, check])
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tight text-gradient-tech">SerpAlert</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-5xl space-y-6">
        {brands.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-gradient-tech">Welcome to SerpAlert</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Start monitoring your brand keywords
              </p>
            </div>
            <Link
              href="/dashboard/new"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Create Your First Brand
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground font-mono">
                All Brands
              </h2>
              <Link
                href="/dashboard/new"
                className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                + Add Brand
              </Link>
            </div>

            {/* Brand grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((b) => {
                const lastCheck = checkMap.get(b.id)
                const hasThreat = lastCheck && lastCheck.competitorCount > 0
                const planClass = planColors[b.plan ?? 'free'] ?? planColors.free

                return (
                  <div
                    key={b.id}
                    className="bg-card border border-border rounded-lg p-5 tech-card-hover"
                  >
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">{b.name}</h3>
                        <p className="font-mono text-sm text-muted-foreground">
                          {b.domain || 'No domain set'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {b.userId ?? 'Admin-created'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono uppercase tracking-wider ${planClass}`}>
                          {b.plan ?? 'free'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {b.keywords.length} keyword{b.keywords.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: hasThreat
                              ? 'oklch(65% 0.25 25)'
                              : 'oklch(72% 0.15 145)',
                          }}
                        />
                        {hasThreat ? (
                          <span className="text-muted-foreground">
                            {lastCheck.competitorCount} competitor{lastCheck.competitorCount !== 1 ? 's' : ''} detected
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Protected</span>
                        )}
                      </div>

                      <Link
                        href={`/dashboard/${b.id}`}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-4 text-xs font-medium hover:bg-muted transition-colors w-full"
                      >
                        Open Dashboard
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
