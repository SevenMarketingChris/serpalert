import { NextResponse } from 'next/server'
import { auth } from '../../../../../../../../auth'
import { isAdminEmail } from '@/lib/auth'
import { getBrandById, getSerpCheckWithAds, updateAllAdsStatusForCheck } from '@/lib/db/queries'

const VALID_STATUSES = ['new', 'acknowledged', 'reported', 'resolved'] as const
type AdStatus = typeof VALID_STATUSES[number]

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ brandId: string; checkId: string }> },
) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { brandId, checkId } = await params

  const brand = await getBrandById(brandId)
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
  }

  // Must be admin or brand owner
  const isAdmin = isAdminEmail(session.user.email)
  if (!isAdmin && brand.userId !== session.user.email) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { status } = body as { status?: string }
  if (!status || !VALID_STATUSES.includes(status as AdStatus)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 },
    )
  }

  // Verify the check belongs to this brand
  const result = await getSerpCheckWithAds(checkId)
  if (!result || result.check.brandId !== brandId) {
    return NextResponse.json({ error: 'Check not found' }, { status: 404 })
  }

  await updateAllAdsStatusForCheck(checkId, status)
  return NextResponse.json({ ok: true, checkId, status })
}
