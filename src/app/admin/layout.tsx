import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { checkIsAdmin } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!await checkIsAdmin()) redirect('/unauthorized')
  return <>{children}</>
}
