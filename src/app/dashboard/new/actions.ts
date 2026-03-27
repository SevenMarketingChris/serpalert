'use server'

import { redirect } from 'next/navigation'
import { createBrandForUser, PLAN_LIMITS } from '@/lib/db/queries'

export type CreateUserBrandState = {
  error?: string
} | null

export async function createBrand(
  _prev: CreateUserBrandState,
  formData: FormData,
): Promise<CreateUserBrandState> {
  const name = ((formData.get('name') as string) ?? '').trim()
  if (!name) return { error: 'Brand name is required' }

  const domain = ((formData.get('domain') as string) ?? '').trim() || undefined
  const keywordsRaw = ((formData.get('keywords') as string) ?? '')
  const keywords = keywordsRaw
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)
    .slice(0, PLAN_LIMITS.free.keywords)

  try {
    await createBrandForUser({ name, domain, keywords }, 'admin')
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
