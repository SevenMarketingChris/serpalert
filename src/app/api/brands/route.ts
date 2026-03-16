import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { getAllActiveBrands, createBrand } from '@/lib/db/queries'

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getAllActiveBrands())
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const brand = await createBrand({
    name: body.name,
    slug: body.slug ?? body.name.toLowerCase().replace(/\s+/g, '-'),
    keywords: body.keywords ?? [],
    googleAdsCustomerId: body.googleAdsCustomerId,
    slackWebhookUrl: body.slackWebhookUrl,
  })
  return NextResponse.json(brand, { status: 201 })
}
