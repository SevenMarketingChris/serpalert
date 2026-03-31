import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStripe } from '@/lib/stripe'
import { getBrandById } from '@/lib/db/queries'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
  if (!brandId || !UUID_RE.test(brandId)) {
    return NextResponse.json({ error: 'Invalid brand ID' }, { status: 400 })
  }

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
