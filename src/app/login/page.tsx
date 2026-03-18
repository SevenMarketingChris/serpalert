import { signIn, auth } from '../../../auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/admin')

  return (
    <div className="min-h-screen bg-background dark:bg-dot-pattern flex items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border border-t-2 border-t-primary bg-card p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-gradient-neon">SERP ALERT</h1>
            <p className="text-sm text-muted-foreground">Monitor competitor activity in real time</p>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: '/admin' })
            }}
          >
            <Button type="submit" className="w-full neon-glow font-semibold tracking-wide">
              Continue with Google
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
