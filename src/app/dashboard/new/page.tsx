import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { PLAN_LIMITS, getBrandsForUser } from '@/lib/db/queries'
import { ThemeToggle } from '@/components/theme-toggle'
import { NewUserBrandForm } from './new-user-brand-form'

export default async function NewBrandPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const userBrands = await getBrandsForUser(userId)
  const currentPlan = (userBrands[0]?.plan ?? 'free') as keyof typeof PLAN_LIMITS
  const keywordLimit = PLAN_LIMITS[currentPlan]?.keywords ?? PLAN_LIMITS.free.keywords

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="container mx-auto max-w-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Back
            </Link>
            <span className="text-border">|</span>
            <h1 className="text-xl font-black tracking-tight text-gradient-tech">SerpAlert</h1>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-lg space-y-6">
        <div className="space-y-1 text-center">
          <h2 className="text-2xl font-black tracking-tight text-gradient-tech">Create New Brand</h2>
          <p className="text-sm text-muted-foreground">
            Set up a brand to start monitoring competitor ads on your keyword.
          </p>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-700 space-y-2">
          <p className="font-semibold">Quick setup guide:</p>
          <ol className="list-decimal list-inside space-y-1 text-indigo-600">
            <li><strong>Brand name</strong> — enter your brand exactly as customers would search for it</li>
            <li><strong>Domain</strong> — your website (e.g. yourbrand.com) so we don&apos;t flag your own ads</li>
            <li><strong>Keyword</strong> — the search term to monitor (typically your brand name)</li>
          </ol>
          <p className="text-indigo-500 text-xs">Your first check will run within the hour. You&apos;ll get alerts if any competitors are bidding on your brand.</p>
        </div>

        <div className="max-w-lg mx-auto">
          <NewUserBrandForm keywordLimit={keywordLimit} />
        </div>
      </div>
    </div>
  )
}
