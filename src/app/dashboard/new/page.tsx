import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '../../../../auth'
import { isAdminEmail } from '@/lib/auth'
import { getUserBrandCount, PLAN_LIMITS } from '@/lib/db/queries'
import { Card, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { NewUserBrandForm } from './new-user-brand-form'

export default async function NewBrandPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (isAdminEmail(session.user?.email)) redirect('/admin')

  const userEmail = session.user?.email ?? ''
  const brandCount = await getUserBrandCount(userEmail)
  const atLimit = brandCount >= PLAN_LIMITS.free.brands

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </Link>
            <span className="text-border">|</span>
            <h1 className="text-xl font-black tracking-tight text-gradient-tech">SerpAlert</h1>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-gradient-tech">Add a brand</h2>
          <p className="text-sm text-muted-foreground">
            Set up a brand to start monitoring competitor ads on your keywords.
          </p>
        </div>

        {atLimit ? (
          /* Upgrade prompt */
          <Card className="metric-stripe-orange max-w-lg tech-card-hover">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="font-semibold">Free plan limit reached</p>
                <p className="text-sm text-muted-foreground">
                  You&apos;re using {brandCount} of {PLAN_LIMITS.free.brands} brand on the free plan.
                  Upgrade to monitor more brands.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="mailto:hello@serpalert.co.uk?subject=Upgrade%20request"
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Contact us to upgrade
                </a>
                <Link
                  href="/dashboard"
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-5 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Back to dashboard
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <NewUserBrandForm keywordLimit={PLAN_LIMITS.free.keywords} />
        )}
      </div>
    </div>
  )
}
