import Link from 'next/link'
import { PLAN_LIMITS } from '@/lib/db/queries'
import { ThemeToggle } from '@/components/theme-toggle'
import { NewUserBrandForm } from './new-user-brand-form'

export default async function NewBrandPage() {
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
            Set up a brand to start monitoring competitor ads on your keywords.
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <NewUserBrandForm keywordLimit={PLAN_LIMITS.free.keywords} />
        </div>
      </div>
    </div>
  )
}
