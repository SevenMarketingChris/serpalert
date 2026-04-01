import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBrandById, getAdCopyHistory } from '@/lib/db/queries'
import { checkIsAdmin } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = await checkIsAdmin()
  const brand = await getBrandById(brandId)
  if (!brand) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (brand.agencyManaged && !isAdmin) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!brand.agencyManaged && brand.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const url = new URL(request.url)
  const domain = url.searchParams.get('domain')
  if (!domain) {
    return NextResponse.json({ error: 'Missing domain parameter' }, { status: 400 })
  }

  const adCopy = await getAdCopyHistory(brandId, domain)
  return NextResponse.json(adCopy)
}
