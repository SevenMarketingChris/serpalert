import { NextResponse } from 'next/server'
import { auth } from '../../../../../../../../auth'
import { isAdminEmail } from '@/lib/auth'
import { getBrandById, getCompetitorAdById, updateCompetitorAdStatus } from '@/lib/db/queries'

const VALID_STATUSES = ['new', 'acknowledged', 'reported', 'resolved'] as const
type AdStatus = typeof VALID_STATUSES[number]

const STATUS_ORDER: Record<AdStatus, number> = {
  new: 0,
  acknowledged: 1,
  reported: 2,
  resolved: 3,
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ brandId: string; adId: string }> },
) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { brandId, adId } = await params

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

  const ad = await getCompetitorAdById(adId)
  if (!ad) {
    return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
  }

  if (ad.brandId !== brandId) {
    return NextResponse.json({ error: 'Ad does not belong to this brand' }, { status: 404 })
  }

  // Validate forward-only transitions
  const currentOrder = STATUS_ORDER[ad.status as AdStatus]
  const newOrder = STATUS_ORDER[status as AdStatus]
  if (newOrder <= currentOrder) {
    return NextResponse.json(
      { error: `Cannot transition from '${ad.status}' to '${status}'. Status can only move forward: new -> acknowledged -> reported -> resolved` },
      { status: 400 },
    )
  }

  const updated = await updateCompetitorAdStatus(adId, status)
  return NextResponse.json(updated)
}
