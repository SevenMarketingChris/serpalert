import { signIn, auth } from '../../../auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

export default async function RegisterPage() {
  const session = await auth()
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border border-t-2 border-t-primary bg-card shadow-sm p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-gradient-tech">SERP ALERT</h1>
            <p className="text-sm text-muted-foreground">Start your free brand monitoring trial</p>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: '/dashboard' })
            }}
          >
            <Button type="submit" className="w-full font-semibold tracking-wide">
              Sign up with Google
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  )
}
