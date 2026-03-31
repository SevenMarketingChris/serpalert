import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminRequest } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { getAllActiveBrands, createBrand } from '@/lib/db/queries'

const CreateBrandSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(200),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(200).optional(),
  keywords: z.array(z.string().trim().min(1).max(200)).max(500).default([]),
  domain: z.string().trim().max(253).optional(),
  googleAdsCustomerId: z.string().trim().regex(/^\d{3}-?\d{3}-?\d{4}$/, 'Invalid Google Ads Customer ID format').optional(),
  slackWebhookUrl: z.string().url().startsWith('https://hooks.slack.com/').optional(),
  monthlyBrandSpend: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a positive number').optional(),
  brandRoas: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a positive number').optional(),
})

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getAllActiveBrands(), { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { ok } = rateLimit('api-brands-post', { limit: 30, windowMs: 60_000 })
  if (!ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CreateBrandSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation failed' }, { status: 400 })
  }

  const { name, keywords, domain, googleAdsCustomerId, slackWebhookUrl, monthlyBrandSpend, brandRoas } = parsed.data
  const slug = parsed.data.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  try {
    const brand = await createBrand({
      name, slug, keywords, domain, googleAdsCustomerId, slackWebhookUrl, monthlyBrandSpend, brandRoas,
    })
    return NextResponse.json(brand, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'A brand with that slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 })
  }
}
