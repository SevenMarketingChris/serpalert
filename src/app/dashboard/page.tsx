import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { UserButton } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { getBrandsForUser, getLastCheckForBrand, getUserBrandCount, PLAN_LIMITS } from '@/lib/db/queries'
import type { Brand, SerpCheck } from '@/lib/db/schema'
import { ThemeToggle } from '@/components/theme-toggle'
import { getRelativeTime } from '@/lib/time'
import { SubscribeBanner } from '@/components/subscribe-banner'
import { SubscribeButton } from '@/components/subscribe-button'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const brands: Brand[] = await getBrandsForUser(userId)
  const brandCount = await getUserBrandCount(userId)
  const canAddBrand = brandCount < PLAN_LIMITS.free.brands

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
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tight text-gradient-tech">SerpAlert</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-5xl space-y-6">
        {brands.map((b) => {
          if (b.agencyManaged || b.subscriptionStatus === 'active') return null
          return <SubscribeBanner key={`banner-${b.id}`} brand={b} />
        })}

        {brands.length === 0 ? (
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
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground font-mono">
                Your Brands
              </h2>
              {canAddBrand && (
                <Link
                  href="/dashboard/new"
                  className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  + Add Brand
                </Link>
              )}
            </div>

            <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                <span className="font-mono font-bold text-foreground">{brands.length}</span> brand{brands.length !== 1 ? 's' : ''}
              </span>
              <span className="text-border">·</span>
              <span className="text-muted-foreground">
                <span className="font-mono font-bold text-foreground">{brands.reduce((s, b) => s + b.keywords.length, 0)}</span> keywords
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((b) => {
                const lastCheck = checkMap.get(b.id)
                const hasThreat = lastCheck && lastCheck.competitorCount > 0
                const isExpired = b.subscriptionStatus === 'trialing' && b.trialEndsAt && b.trialEndsAt <= new Date()
                const isCanceled = b.subscriptionStatus === 'canceled'

                return (
                  <div key={b.id} className="relative">
                    <Link
                      href={`/dashboard/${b.id}`}
                      className={`block bg-card border border-border rounded-lg p-5 tech-card-hover ${(isExpired || isCanceled) ? 'opacity-60' : ''}`}
                    >
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg">{b.name}</h3>
                          <p className="font-mono text-sm text-muted-foreground">
                            {b.domain || 'No domain set'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {b.subscriptionStatus === 'active' && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono bg-emerald-500/10 text-emerald-600">
                              Active
                            </span>
                          )}
                          {b.subscriptionStatus === 'trialing' && !isExpired && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono bg-blue-500/10 text-blue-600">
                              Trial
                            </span>
                          )}
                          {isExpired && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono bg-red-500/10 text-red-600">
                              Expired
                            </span>
                          )}
                          {isCanceled && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono bg-red-500/10 text-red-600">
                              Canceled
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {b.keywords.length} keyword{b.keywords.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${hasThreat ? 'bg-red-500' : 'bg-emerald-500'}`}
                          />
                          {hasThreat ? (
                            <span className="text-muted-foreground">
                              {lastCheck.competitorCount} competitor{lastCheck.competitorCount !== 1 ? 's' : ''} detected
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Protected</span>
                          )}
                          {lastCheck && (
                            <span className="text-muted-foreground font-mono text-xs">
                              {getRelativeTime(lastCheck.checkedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                    {(isExpired || isCanceled) && (
                      <div className="absolute bottom-3 right-3">
                        <SubscribeButton brandId={b.id} />
                      </div>
                    )}
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
