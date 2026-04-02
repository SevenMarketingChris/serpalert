import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { checkIsAdmin } from '@/lib/auth'
import { AdminNewAgencyForm } from './admin-new-agency-form'

export default async function NewAgencyPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!await checkIsAdmin()) redirect('/unauthorized')

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">Create Agency</h1>
      <AdminNewAgencyForm />
    </div>
  )
}
