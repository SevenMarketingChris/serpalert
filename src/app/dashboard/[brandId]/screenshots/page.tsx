import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getBrandById, getScreenshotsForBrand } from '@/lib/db/queries'
import { checkIsAdmin } from '@/lib/auth'
import { ScreenshotGallery } from '@/components/screenshot-gallery'

export default async function ScreenshotsPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const isAdmin = await checkIsAdmin()

  const brand = await getBrandById(brandId)
  if (!brand) notFound()
  if (brand.agencyManaged && !isAdmin) notFound()
  if (!brand.agencyManaged && brand.userId !== userId) notFound()

  const screenshots = await getScreenshotsForBrand(brandId, 100)

  return (
    <div className="max-w-5xl space-y-4">
      <ScreenshotGallery screenshots={screenshots} />
    </div>
  )
}
