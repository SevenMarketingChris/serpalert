import Link from 'next/link'
import { getAllActiveBrands, getLastCheckForBrand } from '@/lib/db/queries'
import type { SerpCheck } from '@/lib/db/schema'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { Shield } from 'lucide-react'

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export default async function AdminBrandsPage() {

  const brands = await getAllActiveBrands()

  // Fetch last check for each brand
  const lastCheckResults = await Promise.allSettled(
    brands.map(async (b) => {
      const check = await getLastCheckForBrand(b.id)
      return { brandId: b.id, check }
    })
  )
  const checkMap = new Map<string, SerpCheck | null>(
    lastCheckResults
      .filter((r): r is PromiseFulfilledResult<{ brandId: string; check: SerpCheck | null }> => r.status === 'fulfilled')
      .map(({ value: { brandId, check } }) => [brandId, check])
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="container mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tight text-gradient-tech">SerpAlert</h1>
            <Badge className="font-mono text-xs tracking-widest">ADMIN</Badge>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-6xl space-y-6">
        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="bg-card border border-border rounded-lg p-4 inline-block">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-1">Total Brands</p>
            <p className="text-3xl font-black text-gradient-tech">{brands.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 inline-block">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-1">Total Keywords</p>
            <p className="text-3xl font-black text-gradient-tech">{brands.reduce((s, b) => s + b.keywords.length, 0)}</p>
          </div>
        </div>

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

        {brands.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
              <Shield className="h-6 w-6" />
            </div>
            <p className="font-semibold text-foreground">No brands yet</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Add your first brand to start monitoring for competitor ads on your keywords.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Domain</th>
                    <th className="px-4 py-3 font-medium">Keywords</th>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Last Check</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((b) => {
                    const lastCheck = checkMap.get(b.id)
                    const hasThreat = lastCheck != null && (lastCheck.competitorCount ?? 0) > 0
                    return (
                      <tr
                        key={b.id}
                        className="border-b border-border last:border-b-0 hover:bg-card/80 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-sm">{b.name}</div>
                          <div className="text-xs text-muted-foreground">{b.userId ?? 'Admin-created'}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                          {b.domain || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {b.keywords.slice(0, 3).map((kw) => (
                              <span
                                key={kw}
                                className="bg-tech-purple/10 text-tech-purple text-xs font-mono px-2 py-0.5 rounded"
                              >
                                {kw}
                              </span>
                            ))}
                            {b.keywords.length > 3 && (
                              <span className="text-muted-foreground text-xs">
                                +{b.keywords.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs uppercase tracking-wider">
                            {b.plan ?? 'free'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span
                              className={`inline-block w-2 h-2 rounded-full ${hasThreat ? 'bg-red-500' : 'bg-emerald-500'}`}
                            />
                            {hasThreat ? 'Threats' : 'Clear'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                          {lastCheck ? formatRelativeTime(new Date(lastCheck.checkedAt)) : 'Never'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/dashboard/${b.id}`}
                              className="inline-flex h-7 items-center justify-center rounded-lg px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground transition-colors"
                            >
                              Dashboard
                            </Link>
                            <Link
                              href={`/client/${b.clientToken}`}
                              className="inline-flex h-7 items-center justify-center rounded-lg px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground transition-colors"
                            >
                              Client
                            </Link>
                            <Link
                              href={`/dashboard/${b.id}/settings`}
                              className="inline-flex h-7 items-center justify-center rounded-lg px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground transition-colors"
                            >
                              Settings
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {brands.map((b) => {
                const lastCheck = checkMap.get(b.id)
                const hasThreat = lastCheck != null && (lastCheck.competitorCount ?? 0) > 0
                return (
                  <div key={b.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-sm">{b.name}</h3>
                        <p className="font-mono text-xs text-muted-foreground">{b.domain || '—'}</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${hasThreat ? 'bg-red-500' : 'bg-emerald-500'}`}
                        />
                        {hasThreat ? 'Threats' : 'Clear'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/${b.id}`}
                        className="inline-flex h-7 items-center justify-center rounded-lg px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground transition-colors border border-border"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href={`/dashboard/${b.id}/settings`}
                        className="inline-flex h-7 items-center justify-center rounded-lg px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground transition-colors border border-border"
                      >
                        Settings
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
