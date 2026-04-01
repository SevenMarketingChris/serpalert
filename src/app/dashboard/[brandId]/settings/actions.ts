'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { getBrandById, updateBrand, deleteBrand, PLAN_LIMITS } from '@/lib/db/queries'
import { checkIsAdmin, authorizeBrandAccess } from '@/lib/auth'
import { z } from 'zod'

export type SettingsState = {
  error?: string
  success?: string
} | null

export async function updateBrandDetails(
  _prev: SettingsState,
  formData: FormData,
  brandId: string,
): Promise<SettingsState> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }
  const isAdmin = await checkIsAdmin()

  const brand = await getBrandById(brandId)
  if (!brand) return { error: 'Brand not found' }

  try {
    authorizeBrandAccess(brand, userId, isAdmin)
  } catch {
    return { error: 'Not authorized' }
  }

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
  brandId: string,
): Promise<SettingsState> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }
  if (!await checkIsAdmin()) return { error: 'Admin access required' }

  const brand = await getBrandById(brandId)
  if (!brand) return { error: 'Brand not found' }

  const monthlyBrandSpend = ((formData.get('monthlyBrandSpend') as string) ?? '').trim() || null
  const brandRoas = ((formData.get('brandRoas') as string) ?? '').trim() || null
  const watchlistDomainsRaw = ((formData.get('watchlistDomains') as string) ?? '').trim()
  const watchlistDomains = watchlistDomainsRaw ? watchlistDomainsRaw.split(',').map(d => d.trim()).filter(Boolean) : []
  const active = formData.get('active') === 'on'

  // Validate numeric fields with zod
  if (monthlyBrandSpend !== null) {
    const parsed = z.coerce.number().positive().safeParse(monthlyBrandSpend)
    if (!parsed.success) {
      return { error: 'Monthly brand spend must be a positive number' }
    }
  }
  if (brandRoas !== null) {
    const parsed = z.coerce.number().positive().safeParse(brandRoas)
    if (!parsed.success) {
      return { error: 'Brand ROAS must be a positive number' }
    }
  }

  try {
    await updateBrand(brandId, {
      monthlyBrandSpend,
      brandRoas,
      watchlistDomains,
      active,
    })
    revalidatePath(`/dashboard/${brandId}`)
    return { success: 'Admin settings updated' }
  } catch {
    return { error: 'Failed to update admin settings' }
  }
}

export async function updateAlertConfig(
  _prev: SettingsState,
  formData: FormData,
  brandId: string,
): Promise<SettingsState> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const brand = await getBrandById(brandId)
  if (!brand) return { error: 'Brand not found' }

  const isAdmin = await checkIsAdmin()
  try {
    authorizeBrandAccess(brand, userId, isAdmin)
  } catch {
    return { error: 'Not authorized' }
  }

  const slackWebhookUrl = ((formData.get('slackWebhookUrl') as string) ?? '').trim() || null
  const alertThreshold = parseInt(formData.get('alertThreshold') as string) || 1

  if (slackWebhookUrl && !slackWebhookUrl.startsWith('https://hooks.slack.com/')) {
    return { error: 'Slack webhook URL must start with https://hooks.slack.com/' }
  }

  const alertConfig = JSON.stringify({ alertThreshold })

  try {
    await updateBrand(brandId, { slackWebhookUrl, alertConfig })
    revalidatePath(`/dashboard/${brandId}`)
    return { success: 'Alert settings updated' }
  } catch {
    return { error: 'Failed to update alert settings' }
  }
}

export async function updateGoogleAds(
  _prev: SettingsState,
  formData: FormData,
  brandId: string,
): Promise<SettingsState> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const brand = await getBrandById(brandId)
  if (!brand) return { error: 'Brand not found' }

  const isAdmin = await checkIsAdmin()
  try {
    authorizeBrandAccess(brand, userId, isAdmin)
  } catch {
    return { error: 'Not authorized' }
  }

  const googleAdsCustomerId = ((formData.get('googleAdsCustomerId') as string) ?? '').trim() || null
  const brandCampaignId = ((formData.get('brandCampaignId') as string) ?? '').trim() || null

  try {
    await updateBrand(brandId, { googleAdsCustomerId, brandCampaignId })
    revalidatePath(`/dashboard/${brandId}`)
    return { success: 'Google Ads settings updated' }
  } catch {
    return { error: 'Failed to update Google Ads settings' }
  }
}

export async function deleteBrandAction(brandId: string): Promise<{ error?: string } | void> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }
  const isAdmin = await checkIsAdmin()

  const brand = await getBrandById(brandId)
  if (!brand) return { error: 'Brand not found' }

  try {
    authorizeBrandAccess(brand, userId, isAdmin)
  } catch {
    return { error: 'Not authorized' }
  }

  await deleteBrand(brandId)
  redirect('/dashboard')
}
