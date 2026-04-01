import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { PLAN_LIMITS, getBrandsForUser } from '@/lib/db/queries'
import { AppHeader } from '@/components/app-header'
import { NewUserBrandForm } from './new-user-brand-form'

export default async function NewBrandPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

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

        <div className="max-w-lg mx-auto">
          <NewUserBrandForm keywordLimit={keywordLimit} />
        </div>
      </div>
    </div>
  )
}
