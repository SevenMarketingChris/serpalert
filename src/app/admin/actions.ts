'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '../../../auth'
import { isAdminEmail } from '@/lib/auth'
import { createBrand } from '@/lib/db/queries'

export type CreateBrandState = {
  clientToken?: string
  error?: string
} | null

export async function createBrandAction(_prev: CreateBrandState, formData: FormData): Promise<CreateBrandState> {
  const session = await auth()
  if (!session) return { error: 'Unauthorized' }
  if (!isAdminEmail(session.user?.email)) return { error: 'Unauthorized' }

  const name = ((formData.get('name') as string) ?? '').trim()
  const keywords = ((formData.get('keywords') as string) ?? '')
    .split(/[\n,]/)
    .map(k => k.trim())
    .filter(Boolean)
  const domain = ((formData.get('domain') as string) ?? '').trim() || undefined
  const customerId = ((formData.get('customerId') as string) ?? '').trim() || undefined
  const slack = ((formData.get('slack') as string) ?? '').trim() || undefined
  const spendRaw = ((formData.get('monthlyBrandSpend') as string) ?? '').trim() || undefined
  const roasRaw = ((formData.get('brandRoas') as string) ?? '').trim() || undefined

  if (!name) return { error: 'Brand name is required' }

  try {
    const brand = await createBrand({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      keywords,
      domain,
      googleAdsCustomerId: customerId,
      slackWebhookUrl: slack,
      monthlyBrandSpend: spendRaw && !isNaN(parseFloat(spendRaw)) ? String(parseFloat(spendRaw)) : undefined,
      brandRoas: roasRaw && !isNaN(parseFloat(roasRaw)) ? String(parseFloat(roasRaw)) : undefined,
    })
    revalidatePath('/admin')
    return { clientToken: brand.clientToken }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) return { error: 'A brand with that name already exists' }
    console.error('Brand creation failed:', err)
    return { error: 'Failed to create brand' }
  }
}
