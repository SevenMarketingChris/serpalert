import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { checkIsAdmin } from '@/lib/auth'
import { getAllAgencies, getAgencyBrandCount } from '@/lib/db/queries'
import { calculateAgencyMonthlyTotal } from '@/lib/pricing'

export default async function AdminAgenciesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!await checkIsAdmin()) redirect('/unauthorized')

  const agenciesList = await getAllAgencies()
  const agenciesWithCounts = await Promise.all(
    agenciesList.map(async a => ({
      ...a,
      brandCount: await getAgencyBrandCount(a.id),
      monthlyTotal: calculateAgencyMonthlyTotal(await getAgencyBrandCount(a.id)),
    }))
  )

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Agencies</h1>
        <Link href="/admin/agencies/new" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-700">
          + Add Agency
        </Link>
      </div>

      {agenciesWithCounts.length === 0 ? (
        <p className="text-sm text-gray-500">No agencies yet.</p>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl overflow-hidden shadow-lg shadow-gray-200/20">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] uppercase tracking-wider text-gray-400 font-mono">
                <th className="px-4 py-3 text-left">Agency</th>
                <th className="px-4 py-3 text-left">Owner</th>
                <th className="px-4 py-3 text-right">Brands</th>
                <th className="px-4 py-3 text-right">Monthly</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agenciesWithCounts.map(a => (
                <tr key={a.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{a.ownerEmail}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">{a.brandCount}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">&pound;{a.monthlyTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
