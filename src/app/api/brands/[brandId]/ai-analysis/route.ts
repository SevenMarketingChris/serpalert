import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBrandById, getAdCopyHistory } from '@/lib/db/queries'
import { generateAdCopyAnalysis } from '@/lib/ai'

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

  const { checkIsAdmin } = await import('@/lib/auth')
  const isAdmin = await checkIsAdmin()

  const brand = await getBrandById(brandId)
  if (!brand) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (brand.agencyManaged && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!brand.agencyManaged && brand.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(request.url)
  const domain = url.searchParams.get('domain')
  if (!domain) return NextResponse.json({ error: 'domain required' }, { status: 400 })

  try {
    const adCopy = await getAdCopyHistory(brandId, domain)
    const headlines = adCopy.map(a => a.headline).filter(Boolean) as string[]
    const descriptions = adCopy.map(a => a.description).filter(Boolean) as string[]

    const analysis = await generateAdCopyAnalysis(brand.name, domain, headlines, descriptions)
    return NextResponse.json({ analysis })
  } catch {
    return NextResponse.json({ error: 'AI analysis unavailable' }, { status: 503 })
  }
}
