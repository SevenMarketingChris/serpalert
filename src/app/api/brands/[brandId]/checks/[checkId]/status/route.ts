import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBrandById, getSerpCheckWithAds, updateAllAdsStatusForCheck } from '@/lib/db/queries'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const VALID_STATUSES = ['new', 'acknowledged', 'reported', 'resolved'] as const
type AdStatus = typeof VALID_STATUSES[number]

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ brandId: string; checkId: string }> },
) {
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const role = (sessionClaims?.publicMetadata as { role?: string })?.role
  const isAdmin = role === 'admin'

  const { brandId, checkId } = await params
  if (!UUID_RE.test(brandId) || !UUID_RE.test(checkId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  // Verify brand ownership
  const brand = await getBrandById(brandId)
  if (!brand) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (brand.agencyManaged && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!brand.agencyManaged && brand.userId !== userId) {
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
