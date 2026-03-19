import { auth } from '../../../auth'
import { redirect } from 'next/navigation'
import { AuthPage } from '@/components/auth-page'

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/dashboard')

  return (
    <AuthPage
      subtitle="Monitor competitor activity in real time"
      buttonLabel="Continue with Google"
    />
  )
}
