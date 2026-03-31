import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getBrandById, getScreenshotsForBrand } from '@/lib/db/queries'
import { checkIsAdmin, authorizeBrandAccess } from '@/lib/auth'
import { ScreenshotGallery } from '@/components/screenshot-gallery'

export default async function ScreenshotsPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const isAdmin = await checkIsAdmin()

  const brand = await getBrandById(brandId)
  if (!brand) notFound()
  try {
    authorizeBrandAccess(brand, userId, isAdmin)
  } catch {
    notFound()
  }

  const screenshots = await getScreenshotsForBrand(brandId, 100)

  return (
    <div className="max-w-5xl space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
        <Link href={`/dashboard/${brandId}`} className="hover:text-indigo-600 transition-colors">&larr; Overview</Link>
        <span>/</span>
        <span className="text-gray-600">Screenshots</span>
      </div>

      <ScreenshotGallery screenshots={screenshots} />
    </div>
  )
}
