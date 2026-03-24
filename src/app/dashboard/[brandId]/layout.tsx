import { redirect, notFound } from 'next/navigation'
import { auth } from '../../../../auth'
import { isAdminEmail } from '@/lib/auth'
import {
  getBrandById,
  getAllActiveBrands,
  getBrandsForUser,
  PLAN_LIMITS,
} from '@/lib/db/queries'
import { Sidebar } from '@/components/sidebar'

export default async function BrandDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ brandId: string }>
}) {
  const { brandId } = await params
  const session = await auth()
  if (!session) redirect('/login')

  const brand = await getBrandById(brandId)
  if (!brand) notFound()

  const isAdmin = isAdminEmail(session.user?.email ?? '')
  if (!isAdmin && brand.userId !== session.user?.email) redirect('/unauthorized')

  const userBrands = isAdmin
    ? await getAllActiveBrands()
    : await getBrandsForUser(session.user?.email ?? '')

  const plan = brand.plan ?? 'free'
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free

  return (
    <div className="flex min-h-screen">
      <Sidebar
        brandId={brandId}
        brandName={brand.name}
        brands={userBrands.map((b) => ({ id: b.id, name: b.name }))}
        plan={plan}
        keywordCount={brand.keywords.length}
        keywordLimit={limits.keywords}
        isAdmin={isAdmin}
        userEmail={session.user?.email ?? ''}
      />
      <main className="flex-1 min-w-0 p-6">{children}</main>
    </div>
  )
}
