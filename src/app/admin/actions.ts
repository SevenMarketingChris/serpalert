'use server'

import { auth } from '../../../auth'
import { createBrand } from '@/lib/db/queries'

export type CreateBrandState = {
  clientToken?: string
  error?: string
} | null

export async function createBrandAction(_prev: CreateBrandState, formData: FormData): Promise<CreateBrandState> {
  const session = await auth()
  if (!session) return { error: 'Unauthorized' }

  const name = formData.get('name') as string
  const keywords = (formData.get('keywords') as string).split('\n').map(k => k.trim()).filter(Boolean)
  const domain = (formData.get('domain') as string) || undefined
  const customerId = (formData.get('customerId') as string) || undefined
  const slack = (formData.get('slack') as string) || undefined
  const spendRaw = (formData.get('monthlyBrandSpend') as string) || undefined
  const roasRaw = (formData.get('brandRoas') as string) || undefined

  if (!name) return { error: 'Brand name is required' }

  try {
    const brand = await createBrand({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      keywords,
      domain,
      googleAdsCustomerId: customerId,
      slackWebhookUrl: slack,
      monthlyBrandSpend: spendRaw ? String(parseFloat(spendRaw)) : undefined,
      brandRoas: roasRaw ? String(parseFloat(roasRaw)) : undefined,
    })
    return { clientToken: brand.clientToken }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create brand'
    if (msg.includes('unique') || msg.includes('duplicate')) return { error: 'A brand with that name already exists' }
    return { error: msg }
  }
}
