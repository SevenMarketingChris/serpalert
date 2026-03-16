import { NextResponse } from 'next/server'
import { isAdminRequest, isSafeOrigin } from '@/lib/auth'
import { getAllActiveBrands, createBrand } from '@/lib/db/queries'
import { auth } from '../../../../auth'

async function isAuthorised(request: Request) {
  if (isAdminRequest(request)) return true
  const session = await auth()
  return !!session?.user
}

export async function GET(request: Request) {
  if (!await isAuthorised(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getAllActiveBrands())
}

export async function POST(request: Request) {
  if (!await isAuthorised(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isSafeOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json()

  // Input validation
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return NextResponse.json({ error: 'Brand name is required' }, { status: 400 })
  }
  if (body.name.length > 100) {
    return NextResponse.json({ error: 'Brand name must be 100 characters or fewer' }, { status: 400 })
  }
  if (body.keywords && (!Array.isArray(body.keywords) || body.keywords.length > 200)) {
    return NextResponse.json({ error: 'Keywords must be an array with at most 200 items' }, { status: 400 })
  }
  if (body.websiteUrl && typeof body.websiteUrl === 'string') {
    try { new URL(body.websiteUrl) } catch { return NextResponse.json({ error: 'Invalid website URL' }, { status: 400 }) }
  }
  if (body.slackWebhookUrl && typeof body.slackWebhookUrl === 'string') {
    try { new URL(body.slackWebhookUrl) } catch { return NextResponse.json({ error: 'Invalid Slack webhook URL' }, { status: 400 }) }
  }

  const name = body.name.trim()
  const brand = await createBrand({
    name,
    slug: body.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    keywords: (body.keywords ?? []).map((k: unknown) => String(k).trim()).filter(Boolean).slice(0, 200),
    googleAdsCustomerId: body.googleAdsCustomerId,
    slackWebhookUrl: body.slackWebhookUrl,
    websiteUrl: body.websiteUrl,
  })
  return NextResponse.json(brand, { status: 201 })
}
