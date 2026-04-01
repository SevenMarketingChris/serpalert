import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { updateBrandSubscription, getBrandByStripeSubscriptionId, getBrandByStripeCustomerId } from '@/lib/db/queries'
import { db } from '@/lib/db'
import { processedEvents } from '@/lib/db/schema'
import { emitServerAnalyticsEvent } from '@/lib/analytics/server'
import type { AttributionContext } from '@/lib/attribution'

function attributionFromStripeMetadata(metadata: Record<string, string | undefined> | null | undefined): AttributionContext {
  return {
    anonymousId: metadata?.anonymousId ?? 'unknown',
    sessionId: metadata?.sessionId ?? 'unknown',
    firstTouch: metadata?.firstTouchSource
      ? {
          source: metadata.firstTouchSource,
          medium: metadata.firstTouchMedium ?? 'unknown',
          campaign: metadata.firstTouchCampaign ?? undefined,
          landingPath: '/unknown',
          capturedAt: new Date().toISOString(),
        }
      : null,
    lastTouch: metadata?.lastTouchSource
      ? {
          source: metadata.lastTouchSource,
          medium: metadata.lastTouchMedium ?? 'unknown',
          campaign: metadata.lastTouchCampaign ?? undefined,
          landingPath: '/unknown',
          capturedAt: new Date().toISOString(),
        }
      : null,
  }
}

export async function POST(request: Request) {
  const stripe = getStripe()
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const webhookSecret=process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Deduplicate: skip already-processed event IDs.
  try {
    const inserted = await db.insert(processedEvents)
      .values({ eventId: event.id })
      .onConflictDoNothing({ target: processedEvents.eventId })
      .returning({ eventId: processedEvents.eventId })
    if (inserted.length === 0) {
      console.info(`Stripe event ${event.id} already processed — skipping`)
      return NextResponse.json({ received: true, dedup: true })
    }
  } catch (err) {
    console.error(`processed_events insert error for ${event.id}:`, err)
    // Fall through so we do not block subscription state updates.
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const brandId = session.metadata?.brandId
      if (!brandId) {
        console.error('checkout.session.completed missing brandId metadata')
        break
      }

      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id

      const customerId = typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id

      // Only mark active if payment was actually collected
      const paymentStatus = session.payment_status
      const newStatus = paymentStatus === 'paid' ? 'active' : 'trialing'

      await updateBrandSubscription(brandId, {
        stripeCustomerId: customerId ?? undefined,
        stripeSubscriptionId: subscriptionId ?? undefined,
        subscriptionStatus: newStatus,
      })
      if (paymentStatus === 'paid') {
        const attribution = attributionFromStripeMetadata(session.metadata)
        await emitServerAnalyticsEvent({
          name: 'subscription_activated',
          path: '/api/webhooks/stripe',
          brandId,
          userId: session.metadata?.userId,
          properties: {
            paymentStatus,
          },
        }, attribution)
        await emitServerAnalyticsEvent({
          name: 'paid_conversion',
          path: '/api/webhooks/stripe',
          brandId,
          userId: session.metadata?.userId,
          properties: {
            paymentStatus,
          },
        }, attribution)
      }
      console.info(`Brand ${brandId} ${newStatus} via Stripe checkout (payment: ${paymentStatus})`)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object
      const brand = await getBrandByStripeSubscriptionId(subscription.id)
      if (!brand) {
        console.warn(`No brand found for subscription ${subscription.id}`)
        break
      }

      let status: string
      switch (subscription.status) {
        case 'active': status = 'active'; break
        case 'past_due': status = 'past_due'; break
        case 'canceled': status = 'canceled'; break
        case 'unpaid': status = 'canceled'; break
        case 'trialing': status = 'trialing'; break
        case 'incomplete':
        case 'incomplete_expired': status = 'canceled'; break
        default: status = subscription.status; break
      }

      await updateBrandSubscription(brand.id, { subscriptionStatus: status })
      console.info(`Brand ${brand.id} subscription updated to ${status}`)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      const brand = await getBrandByStripeSubscriptionId(subscription.id)
      if (!brand) break

      await updateBrandSubscription(brand.id, { subscriptionStatus: 'canceled' })
      console.info(`Brand ${brand.id} subscription canceled`)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const sub = (invoice as unknown as Record<string, unknown>).subscription
      const subscriptionId = typeof sub === 'string' ? sub : undefined
      if (!subscriptionId) break  // not a subscription invoice
      const customerId = typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id
      if (!customerId) break

      const brand = await getBrandByStripeCustomerId(customerId)
      if (!brand) break
      if (brand.subscriptionStatus === 'canceled') break

      await updateBrandSubscription(brand.id, { subscriptionStatus: 'past_due' })
      console.info(`Brand ${brand.id} payment failed — marked past_due`)

      // Send payment failed email (non-blocking)
      try {
        if (brand.userId) {
          const { getUserEmail, sendPaymentFailedEmail } = await import('@/lib/email')
          const email = await getUserEmail(brand.userId)
          if (email) {
            await sendPaymentFailedEmail(email, brand.name)
          }
        }
      } catch (emailErr) {
        console.error('Payment failed email error:', emailErr)
      }

      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
