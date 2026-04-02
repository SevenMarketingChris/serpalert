import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { checkIsAgencyAdmin } from '@/lib/auth'
import { getBrandsForAgency, getAgencyBrandCount } from '@/lib/db/queries'
import { calculateAgencyMonthlyTotal, getEffectivePerBrandPrice, getAgencyPriceBreakdown } from '@/lib/pricing'
import { UserButton } from '@clerk/nextjs'
import { Plus } from 'lucide-react'

export const metadata = { title: 'Agency Dashboard', robots: { index: false, follow: false } }

export default async function AgencyDashboard() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const { isAgency, agencyId } = await checkIsAgencyAdmin()
  if (!isAgency || !agencyId) redirect('/dashboard')

  const brands = await getBrandsForAgency(agencyId)
  const brandCount = await getAgencyBrandCount(agencyId)
  const monthlyTotal = calculateAgencyMonthlyTotal(brandCount)
  const effectivePrice = getEffectivePerBrandPrice(brandCount)
  const breakdown = getAgencyPriceBreakdown(brandCount)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <div className="border-b border-white/30 bg-white/70 backdrop-blur-xl px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-xl bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">SerpAlert</span>
            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Agency</span>
          </div>
          <UserButton />
        </div>
      </div>

      <div className="mx-auto max-w-5xl p-6 space-y-6">
        {/* Pricing overview */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg shadow-gray-200/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 font-mono">Your Plan</h2>
            <div className="text-right">
              <p className="text-2xl font-bold font-mono text-gray-900">&pound;{monthlyTotal}<span className="text-sm font-normal text-gray-400">/mo</span></p>
              <p className="text-xs text-gray-400">{brandCount} brand{brandCount !== 1 ? 's' : ''} &middot; &pound;{effectivePrice} avg/brand</p>
            </div>
          </div>
          {breakdown.length > 0 && (
            <div className="border-t border-gray-100 pt-3 mt-3">
              <div className="flex flex-wrap gap-3">
                {breakdown.map(b => (
                  <div key={b.tier} className="text-xs text-gray-500">
                    <span className="font-mono font-medium text-gray-700">{b.count}</span> brand{b.count !== 1 ? 's' : ''} &times; &pound;{b.price} = <span className="font-mono font-medium text-gray-700">&pound;{b.subtotal}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                Add more brands to unlock lower per-brand pricing.
              </p>
            </div>
          )}
        </div>

        {/* Brand list */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 font-mono">Client Brands</h2>
          <Link
            href="/agency/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Client
          </Link>
        </div>

        {brands.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-12 text-center shadow-lg shadow-gray-200/20">
            <p className="font-semibold text-gray-900">No clients yet</p>
            <p className="text-sm text-gray-500 mt-1">Add your first client brand to start monitoring.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map(b => (
              <Link
                key={b.id}
                href={`/dashboard/${b.id}`}
                className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-5 shadow-lg shadow-gray-200/20 hover:shadow-md hover:border-indigo-200 transition-all"
              >
                <h3 className="font-semibold text-gray-900">{b.name}</h3>
                <p className="font-mono text-sm text-gray-500">{b.domain || 'No domain'}</p>
                <p className="text-xs text-gray-400 mt-2">{b.keywords.length} keyword{b.keywords.length !== 1 ? 's' : ''}</p>
                {b.invitedEmail && (
                  <p className="text-xs text-indigo-500 mt-1">{b.invitedEmail}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
