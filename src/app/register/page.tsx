import { auth } from '../../../auth'
import { redirect } from 'next/navigation'
import { AuthPage } from '@/components/auth-page'

export default async function RegisterPage() {
  const session = await auth()
  if (session) redirect('/dashboard')

  return (
    <AuthPage
      subtitle="Start your free brand monitoring trial"
      buttonLabel="Sign up with Google"
      footer={
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <a href="/login" className="text-primary hover:underline">Sign in</a>
        </p>
      }
    />
  )
}
