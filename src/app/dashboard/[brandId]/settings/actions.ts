'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { auth } from '../../../../../auth'
import { isAdminEmail } from '@/lib/auth'
import { getBrandById, updateBrand, deleteBrand, PLAN_LIMITS } from '@/lib/db/queries'

export type SettingsState = {
  error?: string
  success?: string
} | null

export async function updateBrandDetails(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await auth()
  if (!session) return { error: 'Unauthorized' }

  const brandId = formData.get('brandId') as string
  if (!brandId) return { error: 'Missing brand ID' }

  const brand = await getBrandById(brandId)
  if (!brand) return { error: 'Brand not found' }

  const isAdmin = isAdminEmail(session.user?.email ?? '')
  if (!isAdmin && brand.userId !== session.user?.email) return { error: 'Unauthorized' }

  const name = ((formData.get('name') as string) ?? '').trim()
  if (!name) return { error: 'Brand name is required' }

  const domain = ((formData.get('domain') as string) ?? '').trim() || null
  const keywordsRaw = ((formData.get('keywords') as string) ?? '')
  const plan = brand.plan ?? 'free'
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free
  const keywords = keywordsRaw
    .split('\n')
    .map(k => k.trim())
    .filter(Boolean)
    .slice(0, limits.keywords)

  try {
    await updateBrand(brandId, { name, domain, keywords })
    revalidatePath(`/dashboard/${brandId}`)
    return { success: 'Brand details updated' }
  } catch {
    return { error: 'Failed to update brand' }
  }
}

export async function updateAdminSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await auth()
  if (!session) return { error: 'Unauthorized' }
  if (!isAdminEmail(session.user?.email ?? '')) return { error: 'Admin access required' }

  const brandId = formData.get('brandId') as string
  if (!brandId) return { error: 'Missing brand ID' }

  const monthlyBrandSpend = ((formData.get('monthlyBrandSpend') as string) ?? '').trim() || null
  const brandRoas = ((formData.get('brandRoas') as string) ?? '').trim() || null
  const googleAdsCustomerId = ((formData.get('googleAdsCustomerId') as string) ?? '').trim() || null
  const slackWebhookUrl = ((formData.get('slackWebhookUrl') as string) ?? '').trim() || null
  const active = formData.get('active') === 'on'

  try {
    await updateBrand(brandId, {
      monthlyBrandSpend,
      brandRoas,
      googleAdsCustomerId,
      slackWebhookUrl,
      active,
    })
    revalidatePath(`/dashboard/${brandId}`)
    return { success: 'Admin settings updated' }
  } catch {
    return { error: 'Failed to update admin settings' }
  }
}

export async function deleteBrandAction(brandId: string): Promise<void> {
  const session = await auth()
  if (!session) return

  const brand = await getBrandById(brandId)
  if (!brand) return

  const isAdmin = isAdminEmail(session.user?.email ?? '')
  if (!isAdmin && brand.userId !== session.user?.email) return

  await deleteBrand(brandId)
  redirect('/dashboard')
}
