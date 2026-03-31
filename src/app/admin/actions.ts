'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { createBrand } from '@/lib/db/queries'
import { checkIsAdmin } from '@/lib/auth'

export type CreateBrandState = {
  clientToken?: string
  error?: string
} | null

export async function createBrandAction(_prev: CreateBrandState, formData: FormData): Promise<CreateBrandState> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }
  if (!await checkIsAdmin()) return { error: 'Admin access required' }

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
  const agencyManaged = formData.get('agencyManaged') === 'on'

  if (!name) return { error: 'Brand name is required' }

  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const brand = await createBrand({
      name,
      slug,
      keywords,
      domain,
      googleAdsCustomerId: customerId,
      slackWebhookUrl: slack,
      monthlyBrandSpend: spendRaw,
      brandRoas: roasRaw,
      agencyManaged,
      subscriptionStatus: agencyManaged ? 'agency' : 'active',
    })
    revalidatePath('/admin/brands')
    return { clientToken: brand.clientToken }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return { error: 'A brand with that name or slug already exists' }
    }
    console.error('Brand creation failed:', err)
    return { error: 'Failed to create brand' }
  }
}
