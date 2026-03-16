import { NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { isAdminRequest } from '@/lib/auth'
import { getBrandById, updateBrandMeta } from '@/lib/db/queries'
import { scrapeSiteInfo } from '@/lib/site-scraper'

async function isAuthorised(request: Request) {
  if (isAdminRequest(request)) return true
  const session = await auth()
  return !!session?.user
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAuthorised(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const brand = await getBrandById(id)
  if (!brand) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!brand.websiteUrl) return NextResponse.json({ error: 'No website URL set for this brand' }, { status: 400 })

  const info = await scrapeSiteInfo(brand.websiteUrl)
  await updateBrandMeta(id, {
    logoUrl: info.logoUrl,
    description: info.description,
    phone: info.phone,
  })

  return NextResponse.json({ ok: true, info })
}
