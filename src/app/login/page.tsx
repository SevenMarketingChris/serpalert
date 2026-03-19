import { auth } from '../../../auth'
import { redirect } from 'next/navigation'
import { AuthPage } from '@/components/auth-page'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await auth()
  if (session) redirect('/dashboard')

  const { error } = await searchParams

  return (
    <AuthPage
      subtitle="Monitor competitor activity in real time"
      buttonLabel="Continue with Google"
      error={error}
    />
  )
}
