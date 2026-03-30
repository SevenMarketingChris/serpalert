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
  const brand = await getBrandById(brandId)
  if (!brand || brand.userId !== userId || !brand.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
  }

  const stripe = getStripe()
  const origin = new URL(request.url).origin

  const session = await stripe.billingPortal.sessions.create({
    customer: brand.stripeCustomerId,
    return_url: `${origin}/dashboard/${brandId}`,
  })

  return NextResponse.json({ url: session.url })
}
