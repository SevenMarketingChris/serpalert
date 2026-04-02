import { cache } from 'react'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import {
  getBrandById,
  getBrandsForUser,
  getAllActiveBrands,
  getLastCheckForBrand,
} from '@/lib/db/queries'
import { Sidebar } from '@/components/sidebar'
import { checkIsAdmin, authorizeBrandAccess } from '@/lib/auth'

// Deduplicate DB calls shared between layout and page within the same request
export const getBrandByIdCached = cache(getBrandById)
export const checkIsAdminCached = cache(checkIsAdmin)

export default async function BrandDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ brandId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const isAdmin = await checkIsAdminCached()

  const { brandId } = await params

  const brand = await getBrandByIdCached(brandId)
  if (!brand) notFound()
  try {
    authorizeBrandAccess(brand, userId, isAdmin)
  } catch {
    notFound()
  }

  const userBrands = await getBrandsForUser(userId)
  // Admin sees all brands (personal + agency) in the switcher
  const allBrands = isAdmin
    ? await getAllActiveBrands()
    : userBrands
  const sidebarBrands = allBrands.map(b => ({ id: b.id, name: b.name }))

  const lastCheck = await getLastCheckForBrand(brandId)

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <Sidebar
        brandId={brandId}
        brandName={brand.name}
        brands={sidebarBrands}
        lastCheckTime={lastCheck ? new Date(lastCheck.checkedAt) : null}
        isAdmin={isAdmin}
        subscriptionStatus={brand.subscriptionStatus ?? 'trialing'}
        trialEndsAt={brand.trialEndsAt ? new Date(brand.trialEndsAt) : null}
        agencyManaged={brand.agencyManaged ?? false}
      />
      <main id="main-content" className="flex-1 min-w-0 p-6">{children}</main>
    </div>
  )
}
