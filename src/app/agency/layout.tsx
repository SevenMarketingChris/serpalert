import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { checkIsAgencyAdmin } from '@/lib/auth'

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const { isAgency } = await checkIsAgencyAdmin()
  if (!isAgency) redirect('/dashboard')
  return <>{children}</>
}
