import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBrandById, getAdCopyHistory } from '@/lib/db/queries'
import { checkIsAdmin, authorizeBrandAccess, checkIsAgencyAdmin } from '@/lib/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: Request, { params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params
  if (!UUID_RE.test(brandId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = await checkIsAdmin()
  const { agencyId: userAgencyId } = await checkIsAgencyAdmin()
  const brand = await getBrandById(brandId)
  if (!brand) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  try {
    authorizeBrandAccess(brand, userId, isAdmin, userAgencyId)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const domain = url.searchParams.get('domain')
  if (!domain) {
    return NextResponse.json({ error: 'Missing domain parameter' }, { status: 400 })
  }

  const adCopy = await getAdCopyHistory(brandId, domain)
  return NextResponse.json(adCopy)
}
