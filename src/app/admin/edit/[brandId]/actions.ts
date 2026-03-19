'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '../../../../../auth'
import { isAdminEmail } from '@/lib/auth'
import { updateBrand } from '@/lib/db/queries'

export type EditBrandState = {
  success?: boolean
  error?: string
} | null

export async function updateBrandAction(
  brandId: string,
  _prev: EditBrandState,
  formData: FormData,
): Promise<EditBrandState> {
  const session = await auth()
  if (!session) return { error: 'Unauthorized' }
  if (!isAdminEmail(session.user?.email)) return { error: 'Unauthorized' }

  const name = ((formData.get('name') as string) ?? '').trim()
  if (!name) return { error: 'Brand name is required' }

  const keywords = ((formData.get('keywords') as string) ?? '')
    .split(/[\n,]/)
    .map(k => k.trim())
    .filter(Boolean)

  const domain = ((formData.get('domain') as string) ?? '').trim() || null
  const customerId = ((formData.get('customerId') as string) ?? '').trim() || null
  const slack = ((formData.get('slack') as string) ?? '').trim() || null
  const spendRaw = ((formData.get('monthlyBrandSpend') as string) ?? '').trim()
  const roasRaw = ((formData.get('brandRoas') as string) ?? '').trim()

  try {
    await updateBrand(brandId, {
      name,
      keywords,
      domain,
      googleAdsCustomerId: customerId,
      slackWebhookUrl: slack,
      monthlyBrandSpend: spendRaw && !isNaN(parseFloat(spendRaw)) ? String(parseFloat(spendRaw)) : null,
      brandRoas: roasRaw && !isNaN(parseFloat(roasRaw)) ? String(parseFloat(roasRaw)) : null,
    })
    revalidatePath('/admin')
    revalidatePath(`/admin/edit/${brandId}`)
    return { success: true }
  } catch (err) {
    console.error('Brand update failed:', err)
    return { error: 'Failed to update brand' }
  }
}
