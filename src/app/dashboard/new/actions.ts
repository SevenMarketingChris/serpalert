'use server'

import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createBrandForUser, getBrandsForUser, getUserBrandCount, PLAN_LIMITS } from '@/lib/db/queries'

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

  try {
    await createBrandForUser({ name, domain, keywords }, userId)
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return { error: 'A brand with that name already exists' }
    }
    console.error('Brand creation failed:', err)
    return { error: 'Failed to create brand' }
  }

  redirect('/dashboard')
}
