import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStripe } from '@/lib/stripe'
import type Stripe from 'stripe'
import { getBrandById } from '@/lib/db/queries'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let brandId: string
  try {
    const body = await request.json()
    brandId = body.brandId
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!brandId) {
    return NextResponse.json({ error: 'brandId required' }, { status: 400 })
  }

  const brand = await getBrandById(brandId)
  if (!brand || brand.userId !== userId) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
  }

  if (brand.stripeSubscriptionId && brand.subscriptionStatus !== 'canceled') {
    return NextResponse.json({ error: 'Already subscribed. Use the billing portal to manage your subscription.' }, { status: 409 })
  }

  const stripe = getStripe()
  const priceId = process.env.STRIPE_PRICE_ID
  if (!priceId) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const origin = new URL(request.url).origin

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { brandId, userId },
    subscription_data: { metadata: { brandId } },
    success_url: `${origin}/dashboard?subscribed=true`,
    cancel_url: `${origin}/dashboard`,
    ...(brand.stripeCustomerId ? { customer: brand.stripeCustomerId } : {}),
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  return NextResponse.json({ url: session.url })
}
