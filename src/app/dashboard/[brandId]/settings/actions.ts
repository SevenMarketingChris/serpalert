'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getBrandById, updateBrand, deleteBrand, PLAN_LIMITS } from '@/lib/db/queries'

export type SettingsState = {
  error?: string
  success?: string
} | null

export async function updateBrandDetails(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const brandId = formData.get('brandId') as string
  if (!brandId) return { error: 'Missing brand ID' }

  const brand = await getBrandById(brandId)
  if (!brand) return { error: 'Brand not found' }

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
  const brandId = formData.get('brandId') as string
  if (!brandId) return { error: 'Missing brand ID' }

  const monthlyBrandSpend = ((formData.get('monthlyBrandSpend') as string) ?? '').trim() || null
  const brandRoas = ((formData.get('brandRoas') as string) ?? '').trim() || null
  const googleAdsCustomerId = ((formData.get('googleAdsCustomerId') as string) ?? '').trim() || null
  const brandCampaignId = ((formData.get('brandCampaignId') as string) ?? '').trim() || null
  const slackWebhookUrl = ((formData.get('slackWebhookUrl') as string) ?? '').trim() || null
  const watchlistDomainsRaw = ((formData.get('watchlistDomains') as string) ?? '').trim()
  const watchlistDomains = watchlistDomainsRaw ? watchlistDomainsRaw.split(',').map(d => d.trim()).filter(Boolean) : []
  const active = formData.get('active') === 'on'

  if (slackWebhookUrl && !slackWebhookUrl.startsWith('https://hooks.slack.com/')) {
    return { error: 'Slack webhook URL must start with https://hooks.slack.com/' }
  }

  try {
    await updateBrand(brandId, {
      monthlyBrandSpend,
      brandRoas,
      googleAdsCustomerId,
      brandCampaignId,
      slackWebhookUrl,
      watchlistDomains,
      active,
    })
    revalidatePath(`/dashboard/${brandId}`)
    return { success: 'Admin settings updated' }
  } catch {
    return { error: 'Failed to update admin settings' }
  }
}

export async function deleteBrandAction(brandId: string): Promise<void> {
  const brand = await getBrandById(brandId)
  if (!brand) return

  await deleteBrand(brandId)
  redirect('/dashboard')
}
