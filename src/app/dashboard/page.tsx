import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { UserButton } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { getBrandsForUser, getAllActiveBrands, getLastChecksForBrands, getUserBrandCount, PLAN_LIMITS } from '@/lib/db/queries'
import type { Brand } from '@/lib/db/schema'
import { AppHeader } from '@/components/app-header'
import { getRelativeTime } from '@/lib/time'
import { SubscribeBanner } from '@/components/subscribe-banner'
import { SubscribeButton } from '@/components/subscribe-button'
import { checkIsAdmin, checkIsAgencyAdmin } from '@/lib/auth'

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false, follow: false } }

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Check if user is an agency admin — redirect to agency dashboard
  let isAgencyUser = false
  try {
    const { isAgency } = await checkIsAgencyAdmin()
    isAgencyUser = isAgency
  } catch {
    // Agency check failed — continue as regular user
  }
  if (isAgencyUser) redirect('/agency')

  // Auto-link invited brands to this user
  try {
    const { currentUser } = await import('@clerk/nextjs/server')
    const user = await currentUser()
    const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress
    if (email) {
      const { linkInvitedBrands } = await import('@/lib/db/queries')
      await linkInvitedBrands(email.toLowerCase(), userId)
    }
  } catch (err) {
    console.error('Auto-link invited brands failed:', err instanceof Error ? err.message : err)
  }

  const isAdmin = await checkIsAdmin()
  const userBrands: Brand[] = await getBrandsForUser(userId)

  // Also find brands where user is invited (linked by email) but userId not yet set
  // This handles agency-managed brands assigned to this user
  const { getInvitedBrandsForEmail } = await import('@/lib/db/queries')
  const { currentUser: getCurrentUser } = await import('@clerk/nextjs/server')
  let invitedBrands: Brand[] = []
  try {
    const user = await getCurrentUser()
    const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress
    if (email) {
      invitedBrands = await getInvitedBrandsForEmail(email.toLowerCase())
    }
  } catch {}

  // Admin sees all agency brands too
  const agencyBrands: Brand[] = isAdmin
    ? (await getAllActiveBrands()).filter(b => b.agencyManaged && !userBrands.some(ub => ub.id === b.id) && !invitedBrands.some(ib => ib.id === b.id))
    : []

  // Deduplicate
  const seenIds = new Set<string>()
  const brands = [...userBrands, ...invitedBrands, ...agencyBrands].filter(b => {
    if (seenIds.has(b.id)) return false
    seenIds.add(b.id)
    return true
  })

  // Auto-redirect single-brand users to their brand dashboard
  if (brands.length === 1 && !isAdmin) {
    redirect(`/dashboard/${brands[0].id}`)
  }

  const brandCount = await getUserBrandCount(userId)
  // Determine plan limit
  const currentPlan = (brands[0]?.plan ?? 'free') as keyof typeof PLAN_LIMITS
  const planLimit = PLAN_LIMITS[currentPlan]?.brands ?? PLAN_LIMITS.free.brands
  const canAddBrand = brandCount < planLimit

  const checkMap = await getLastChecksForBrands(brands.map(b => b.id))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <AppHeader>
        <UserButton />
      </AppHeader>

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

            <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl px-4 py-3 flex items-center gap-4 text-sm shadow-lg shadow-gray-200/20">
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
                      className={`block bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-5 shadow-lg shadow-gray-200/20 hover:shadow-md transition-shadow ${(isExpired || isCanceled) ? 'opacity-60' : ''}`}
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
