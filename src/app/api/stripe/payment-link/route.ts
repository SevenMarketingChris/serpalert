import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { getBrandById } from '@/lib/db/queries'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let brandId: string
  try {
    const body = await request.json()
    brandId = body.brandId
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!brandId || !UUID_RE.test(brandId)) {
    return NextResponse.json({ error: 'Invalid brand ID' }, { status: 400 })
  }
  const brand = await getBrandById(brandId)
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
  }

  if (brand.stripeSubscriptionId && brand.subscriptionStatus !== 'canceled') {
    return NextResponse.json({ error: 'Brand already has an active subscription' }, { status: 409 })
  }

  const stripe = getStripe()
  const priceId = process.env.STRIPE_PRICE_ID
  if (!priceId) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const origin = new URL(request.url).origin

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { brandId },
    subscription_data: { metadata: { brandId } },
    success_url: `${origin}/client/${brand.clientToken}`,
    cancel_url: origin,
  })

  return NextResponse.json({ url: session.url })
}
