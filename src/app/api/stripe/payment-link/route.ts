import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { getBrandById } from '@/lib/db/queries'

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { brandId } = await request.json()
  const brand = await getBrandById(brandId)
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
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
