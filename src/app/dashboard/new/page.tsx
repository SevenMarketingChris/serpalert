import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { PLAN_LIMITS, getBrandsForUser } from '@/lib/db/queries'
import { checkIsAgencyAdmin } from '@/lib/auth'
import { AppHeader } from '@/components/app-header'
import { NewUserBrandForm } from './new-user-brand-form'

export default async function NewBrandPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { isAgency } = await checkIsAgencyAdmin()
  if (isAgency) redirect('/agency/new')

  const userBrands = await getBrandsForUser(userId)
  const currentPlan = (userBrands[0]?.plan ?? 'free') as keyof typeof PLAN_LIMITS
  const keywordLimit = PLAN_LIMITS[currentPlan]?.keywords ?? PLAN_LIMITS.free.keywords

  return (
    <div className="min-h-screen bg-background">
      <AppHeader maxWidth="max-w-lg" backHref="/dashboard" />

      <div className="container mx-auto p-6 max-w-lg space-y-6">
        <div className="space-y-1 text-center">
          <h2 className="text-2xl font-black tracking-tight text-gradient-tech">Create New Brand</h2>
          <p className="text-sm text-muted-foreground">
            Set up a brand to start monitoring competitor ads on your keywords.
          </p>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-700 space-y-2">
          <p className="font-semibold">Quick setup guide:</p>
          <ol className="list-decimal list-inside space-y-1 text-indigo-600">
            <li><strong>Brand name</strong> — enter your brand exactly as customers would search for it</li>
            <li><strong>Domain</strong> — your website (e.g. yourbrand.com) so we don&apos;t flag your own ads</li>
            <li><strong>Keywords</strong> — the search terms to monitor (e.g. your brand name, common misspellings)</li>
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
