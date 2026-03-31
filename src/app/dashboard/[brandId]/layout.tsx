import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import {
  getBrandById,
  getBrandsForUser,
  PLAN_LIMITS,
  getUnresolvedThreatCount,
  getLastCheckForBrand,
} from '@/lib/db/queries'
import { Sidebar } from '@/components/sidebar'
import { checkIsAdmin } from '@/lib/auth'

export default async function BrandDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ brandId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const isAdmin = await checkIsAdmin()

  const { brandId } = await params

  const brand = await getBrandById(brandId)
  if (!brand) notFound()
  if (brand.agencyManaged && !isAdmin) notFound()
  if (!brand.agencyManaged && brand.userId !== userId) notFound()

  const userBrands = await getBrandsForUser(userId)

  const [unresolvedCount, lastCheck] = await Promise.all([
    getUnresolvedThreatCount(brandId),
    getLastCheckForBrand(brandId),
  ])

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
        unresolvedCount={unresolvedCount}
        lastCheckAt={lastCheck ? new Date(lastCheck.checkedAt).toISOString() : null}
      />
      <main className="flex-1 min-w-0 p-6">{children}</main>
    </div>
  )
}
