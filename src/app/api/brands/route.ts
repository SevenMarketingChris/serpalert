// TODO: Add zod validation (zod is not yet in dependencies — run `npm install zod` then add CreateBrandSchema)
import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { getAllActiveBrands, createBrand } from '@/lib/db/queries'

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getAllActiveBrands())
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const keywords = Array.isArray(body.keywords) ? (body.keywords as string[]).filter(k => typeof k === 'string' && k.trim()) : []
  const slug = (typeof body.slug === 'string' && body.slug.trim())
    ? body.slug.trim()
    : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  try {
    const brand = await createBrand({
      name,
      slug,
      keywords,
      domain: typeof body.domain === 'string' ? body.domain.trim() || undefined : undefined,
      googleAdsCustomerId: typeof body.googleAdsCustomerId === 'string' ? body.googleAdsCustomerId.trim() || undefined : undefined,
      slackWebhookUrl: typeof body.slackWebhookUrl === 'string' ? body.slackWebhookUrl.trim() || undefined : undefined,
      monthlyBrandSpend: typeof body.monthlyBrandSpend === 'string' ? body.monthlyBrandSpend || undefined : undefined,
      brandRoas: typeof body.brandRoas === 'string' ? body.brandRoas || undefined : undefined,
    })
    return NextResponse.json(brand, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    const status = msg.includes('unique') || msg.includes('duplicate') ? 409 : 500
    return NextResponse.json({ error: status === 409 ? 'A brand with that slug already exists' : 'Failed to create brand' }, { status })
  }
}
