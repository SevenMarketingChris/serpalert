'use server'

import { redirect } from 'next/navigation'
import { auth } from '../../../../auth'
import { isAdminEmail } from '@/lib/auth'
import { createBrandForUser, getUserBrandCount, PLAN_LIMITS } from '@/lib/db/queries'

export type CreateUserBrandState = {
  error?: string
} | null

export async function createBrand(
  _prev: CreateUserBrandState,
  formData: FormData,
): Promise<CreateUserBrandState> {
  const session = await auth()
  if (!session) return { error: 'Unauthorized' }
  if (isAdminEmail(session.user?.email)) return { error: 'Admins should use the admin panel' }

  const userEmail = session.user?.email
  if (!userEmail) return { error: 'Unauthorized' }

  const name = ((formData.get('name') as string) ?? '').trim()
  if (!name) return { error: 'Brand name is required' }

  // Check plan limit
  const brandCount = await getUserBrandCount(userEmail)
  if (brandCount >= PLAN_LIMITS.free.brands) {
    return { error: `You've reached the limit of ${PLAN_LIMITS.free.brands} brand on the free plan. Upgrade to add more.` }
  }

  const domain = ((formData.get('domain') as string) ?? '').trim() || undefined
  const keywordsRaw = ((formData.get('keywords') as string) ?? '')
  const keywords = keywordsRaw
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)
    .slice(0, PLAN_LIMITS.free.keywords)

  try {
    await createBrandForUser({ name, domain, keywords }, userEmail)
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
