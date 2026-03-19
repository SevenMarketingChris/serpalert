import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getBrandById } from '@/lib/db/queries'
import { auth } from '../../../../../auth'
import { isAdminEmail } from '@/lib/auth'
import { ThemeToggle } from '@/components/theme-toggle'
import { EditBrandForm } from './edit-brand-form'

export default async function EditBrandPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params
  const session = await auth()
  if (!session) redirect('/login')
  if (!isAdminEmail(session.user?.email)) redirect('/unauthorized')

  const brand = await getBrandById(brandId)
  if (!brand) notFound()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </Link>
            <span className="text-border">|</span>
            <h1 className="text-xl font-black tracking-tight text-gradient-tech">Edit: {brand.name}</h1>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
          <span>ID: {brand.id}</span>
          <span>·</span>
          <span>Token: {brand.clientToken.slice(0, 8)}…</span>
          <span>·</span>
          <span>Plan: {brand.plan}</span>
        </div>
        <EditBrandForm brand={brand} />
      </div>
    </div>
  )
}
