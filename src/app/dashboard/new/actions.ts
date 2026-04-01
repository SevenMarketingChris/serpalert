'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { createBrandForUser, getBrandsForUser, getUserBrandCount, PLAN_LIMITS } from '@/lib/db/queries'
import { readAttributionContextFromCookieHeader } from '@/lib/attribution'
import { emitServerAnalyticsEvent } from '@/lib/analytics/server'

export type CreateUserBrandState = {
  error?: string
} | null

export async function createBrand(
  _prev: CreateUserBrandState,
  formData: FormData,
): Promise<CreateUserBrandState> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  // Get user's current brands to determine their plan
  const userBrands = await getBrandsForUser(userId)
  const currentPlan = (userBrands[0]?.plan ?? 'free') as keyof typeof PLAN_LIMITS
  const planLimit = PLAN_LIMITS[currentPlan]?.brands ?? PLAN_LIMITS.free.brands

  const brandCount = await getUserBrandCount(userId)
  const isFirstBrandForUser = brandCount === 0
  if (brandCount >= planLimit) {
    return { error: `You've reached the ${currentPlan} plan limit of ${planLimit} brand${planLimit !== 1 ? 's' : ''}` }
  }

  const name = ((formData.get('name') as string) ?? '').trim()
  if (!name) return { error: 'Brand name is required' }

  const domain = ((formData.get('domain') as string) ?? '').trim() || undefined
  const keywordsRaw = ((formData.get('keywords') as string) ?? '')
  const keywords = keywordsRaw
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)
    .slice(0, PLAN_LIMITS[currentPlan]?.keywords ?? PLAN_LIMITS.free.keywords)

  const requestHeaders = await headers()
  const attribution = readAttributionContextFromCookieHeader(requestHeaders.get('cookie'))

  let createdBrandId: string | undefined

  try {
    const createdBrand = await createBrandForUser({ name, domain, keywords }, userId)
    createdBrandId = createdBrand.id

    const eventPath = '/dashboard/new'
    const eventUrl = requestHeaders.get('referer') || undefined

    try {
      if (isFirstBrandForUser) {
        await emitServerAnalyticsEvent({
          name: 'signup_completed',
          path: eventPath,
          url: eventUrl,
          userId,
          brandId: createdBrand.id,
          properties: {
            brandCountAfterCreate: 1,
            keywordCount: keywords.length,
          },
        }, attribution)
      }

      await emitServerAnalyticsEvent({
        name: 'trial_started',
        path: eventPath,
        url: eventUrl,
        userId,
        brandId: createdBrand.id,
        properties: {
          isFirstBrandForUser,
          keywordCount: keywords.length,
        },
      }, attribution)

      if (keywords.length > 0) {
        await emitServerAnalyticsEvent({
          name: 'first_keyword_created',
          path: eventPath,
          url: eventUrl,
          userId,
          brandId: createdBrand.id,
          properties: {
            keywordCount: keywords.length,
            isFirstBrandForUser,
          },
        }, attribution)
      }
    } catch (analyticsErr) {
      console.error('Brand creation analytics failed:', analyticsErr)
    }

    // Send welcome email (non-blocking)
    try {
      const { currentUser } = await import('@clerk/nextjs/server')
      const user = await currentUser()
      const email = user?.emailAddresses?.[0]?.emailAddress
      if (email) {
        const { sendWelcomeEmail } = await import('@/lib/email')
        await sendWelcomeEmail(email, name)
      }
    } catch (emailErr) {
      console.error('Welcome email failed:', emailErr)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return { error: 'A brand with that name already exists' }
    }
    console.error('Brand creation failed:', err instanceof Error ? err.message : 'Unknown error', { userId, createdBrandId })
    return { error: 'Failed to create brand' }
  }

  redirect('/dashboard')
}
