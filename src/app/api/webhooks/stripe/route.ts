import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { updateBrandSubscription, getBrandByStripeSubscriptionId, getBrandByStripeCustomerId } from '@/lib/db/queries'

export async function POST(request: Request) {
  // Note: No event ID deduplication. All operations are idempotent (upsert/update),
  // so duplicate webhook deliveries are safe. Add event.id tracking if side effects
  // (emails, credits) are added later.
  const stripe = getStripe()
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(invoice as any).subscription) break  // not a subscription invoice
      const customerId = typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id
      if (!customerId) break

      const brand = await getBrandByStripeCustomerId(customerId)
      if (!brand) break

      await updateBrandSubscription(brand.id, { subscriptionStatus: 'past_due' })
      console.info(`Brand ${brand.id} payment failed — marked past_due`)
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
