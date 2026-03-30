import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStripe } from '@/lib/stripe'
import { getBrandById } from '@/lib/db/queries'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { brandId } = await request.json()
  if (!brandId) {
    return NextResponse.json({ error: 'brandId required' }, { status: 400 })
  }

  const brand = await getBrandById(brandId)
  if (!brand || brand.userId !== userId) {
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
    metadata: { brandId, userId },
    success_url: `${origin}/dashboard?subscribed=true`,
    cancel_url: `${origin}/dashboard`,
  })

  return NextResponse.json({ url: session.url })
}
