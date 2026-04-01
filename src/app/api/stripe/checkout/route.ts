import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStripe } from '@/lib/stripe'
import { getBrandById } from '@/lib/db/queries'
import { checkIsAdmin, authorizeBrandAccess } from '@/lib/auth'
import type Stripe from 'stripe'
import { readAttributionContextFromRequest } from '@/lib/attribution'
import { emitServerAnalyticsEvent } from '@/lib/analytics/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  const attribution = readAttributionContextFromRequest(request)
  const requestUrl = new URL(request.url)

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
  if (!brandId || !UUID_RE.test(brandId)) {
    return NextResponse.json({ error: 'Invalid brand ID' }, { status: 400 })
  }

  const [brand, isAdmin] = await Promise.all([
    getBrandById(brandId),
    checkIsAdmin(),
  ])
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
  }
  try {
    authorizeBrandAccess(brand, userId, isAdmin)
  } catch {
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

  const origin = requestUrl.origin
  const metadata: Record<string, string> = {
    brandId,
    userId,
  }

  if (attribution.anonymousId !== 'unknown') metadata.anonymousId = attribution.anonymousId
  if (attribution.sessionId !== 'unknown') metadata.sessionId = attribution.sessionId
  if (attribution.firstTouch?.source) metadata.firstTouchSource = attribution.firstTouch.source
  if (attribution.firstTouch?.medium) metadata.firstTouchMedium = attribution.firstTouch.medium
  if (attribution.firstTouch?.campaign) metadata.firstTouchCampaign = attribution.firstTouch.campaign
  if (attribution.lastTouch?.source) metadata.lastTouchSource = attribution.lastTouch.source
  if (attribution.lastTouch?.medium) metadata.lastTouchMedium = attribution.lastTouch.medium
  if (attribution.lastTouch?.campaign) metadata.lastTouchCampaign = attribution.lastTouch.campaign

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription' as const,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
    subscription_data: { metadata },
    success_url: `${origin}/dashboard?subscribed=true`,
    cancel_url: `${origin}/dashboard`,
  }

  if (brand.stripeCustomerId) {
    sessionParams.customer = brand.stripeCustomerId
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  await emitServerAnalyticsEvent({
    name: 'checkout_started',
    path: requestUrl.pathname,
    url: request.url,
    userId,
    brandId,
    properties: {
      hasStripeCustomer: Boolean(brand.stripeCustomerId),
    },
  }, attribution)

  return NextResponse.json({ url: session.url })
}
