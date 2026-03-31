import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { UserButton } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { getBrandsForUser, getAllActiveBrands, getLastCheckForBrand, getUserBrandCount, PLAN_LIMITS } from '@/lib/db/queries'
import type { Brand, SerpCheck } from '@/lib/db/schema'
import { getRelativeTime } from '@/lib/time'
import { SubscribeBanner } from '@/components/subscribe-banner'
import { SubscribeButton } from '@/components/subscribe-button'
import { checkIsAdmin } from '@/lib/auth'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const isAdmin = await checkIsAdmin()
  const userBrands: Brand[] = await getBrandsForUser(userId)
  // Admin sees agency brands too
  const agencyBrands: Brand[] = isAdmin
    ? (await getAllActiveBrands()).filter(b => b.agencyManaged)
    : []
  const brands = [...userBrands, ...agencyBrands]

  // Auto-redirect single-brand users to their brand dashboard
  if (brands.length === 1) {
    redirect(`/dashboard/${brands[0].id}`)
  }

  const brandCount = await getUserBrandCount(userId)
  // Determine plan limit
  const currentPlan = (brands[0]?.plan ?? 'free') as keyof typeof PLAN_LIMITS
  const planLimit = PLAN_LIMITS[currentPlan]?.brands ?? PLAN_LIMITS.free.brands
  const canAddBrand = brandCount < planLimit

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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tight text-indigo-600">SerpAlert</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link
                href="/admin"
                className="text-xs font-mono text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Admin
              </Link>
            )}
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
              <h2 className="text-2xl font-black tracking-tight text-indigo-600">Welcome to SerpAlert</h2>
              <p className="text-gray-500 text-sm max-w-xs">
                Start monitoring your brand keywords
              </p>
            </div>
            <Link
              href="/dashboard/new"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Create Your First Brand
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 font-mono">
                Your Brands
              </h2>
              {canAddBrand && (
                <Link
                  href="/dashboard/new"
                  className="inline-flex h-8 items-center justify-center rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  + Add Brand
                </Link>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4 text-sm shadow-sm">
              <span className="text-gray-500">
                <span className="font-mono font-bold text-gray-900">{brands.length}</span> brand{brands.length !== 1 ? 's' : ''}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-500">
                <span className="font-mono font-bold text-gray-900">{brands.reduce((s, b) => s + b.keywords.length, 0)}</span> keywords
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
                      className={`block bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${(isExpired || isCanceled) ? 'opacity-60' : ''}`}
                    >
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{b.name}</h3>
                          <p className="font-mono text-sm text-gray-500">
                            {b.domain || 'No domain set'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {b.agencyManaged && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono bg-amber-50 text-amber-700">
                              Agency
                            </span>
                          )}
                          {b.subscriptionStatus === 'active' && !b.agencyManaged && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono bg-emerald-50 text-emerald-700">
                              Active
                            </span>
                          )}
                          {b.subscriptionStatus === 'trialing' && !isExpired && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono bg-indigo-50 text-indigo-700">
                              Trial
                            </span>
                          )}
                          {isExpired && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono bg-red-50 text-red-700">
                              Expired
                            </span>
                          )}
                          {isCanceled && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono bg-red-50 text-red-700">
                              Canceled
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {b.keywords.length} keyword{b.keywords.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${hasThreat ? 'bg-red-500' : 'bg-emerald-500'}`}
                          />
                          {hasThreat ? (
                            <span className="text-gray-500">
                              {lastCheck.competitorCount} competitor{lastCheck.competitorCount !== 1 ? 's' : ''} detected
                            </span>
                          ) : (
                            <span className="text-gray-500">Protected</span>
                          )}
                          {lastCheck && (
                            <span className="text-gray-400 font-mono text-xs">
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
