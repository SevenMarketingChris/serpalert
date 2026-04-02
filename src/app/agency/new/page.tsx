import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { checkIsAgencyAdmin } from '@/lib/auth'
import { AgencyNewBrandForm } from './agency-new-brand-form'

export const metadata = { title: 'Add Client — Agency', robots: { index: false, follow: false } }

export default async function AgencyNewBrandPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const { isAgency, agencyId } = await checkIsAgencyAdmin()
  if (!isAgency || !agencyId) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <div className="border-b border-white/30 bg-white/70 backdrop-blur-xl px-6 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/agency" className="text-sm text-gray-400 hover:text-gray-900">&larr; Back</Link>
            <span className="font-extrabold text-xl bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">SerpAlert</span>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-lg p-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Add Client Brand</h1>
          <p className="text-sm text-gray-500">Set up monitoring for a client&apos;s brand keyword.</p>
        </div>
        <AgencyNewBrandForm agencyId={agencyId} />
      </div>
    </div>
  )
}
