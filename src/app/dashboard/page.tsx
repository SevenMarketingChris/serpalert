import { auth } from '../../../auth'
import { redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/auth'

export default async function DashboardIndexPage() {
  const session = await auth()
  if (!session) redirect('/login')

  // Admins go straight to the admin panel
  if (isAdminEmail(session.user?.email)) {
    redirect('/admin')
  }

  // Regular users — coming soon screen until multi-user support is live
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-gradient-tech">You're in.</h1>
          <p className="text-muted-foreground">
            You're signed in as <span className="font-medium text-foreground">{session.user?.email}</span>.
          </p>
        </div>
        <div className="rounded-xl border border-border border-t-2 border-t-primary bg-card shadow-sm p-6 space-y-3">
          <p className="text-sm font-semibold">Your dashboard is being set up</p>
          <p className="text-sm text-muted-foreground">
            We're configuring your brand monitoring account. You'll receive an email
            when your account is ready — usually within 24 hours.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Questions? Email us at{' '}
          <a href="mailto:hello@serpalert.co.uk" className="text-primary hover:underline">
            hello@serpalert.co.uk
          </a>
        </p>
      </div>
    </div>
  )
}
