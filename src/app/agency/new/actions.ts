'use server'

import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { checkIsAgencyAdmin } from '@/lib/auth'
import { createBrand } from '@/lib/db/queries'

export type AgencyBrandState = {
  error?: string
  success?: string
} | null

export async function createAgencyBrand(
  _prev: AgencyBrandState,
  formData: FormData,
): Promise<AgencyBrandState> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const { isAgency, agencyId } = await checkIsAgencyAdmin()
  if (!isAgency || !agencyId) return { error: 'Not authorized' }

  const submittedAgencyId = formData.get('agencyId') as string
  if (submittedAgencyId !== agencyId) return { error: 'Not authorized' }

  const name = ((formData.get('name') as string) ?? '').trim()
  if (!name) return { error: 'Brand name is required' }

  const domain = ((formData.get('domain') as string) ?? '').trim() || undefined
  const keyword = ((formData.get('keyword') as string) ?? '').trim()
  const clientEmail = ((formData.get('clientEmail') as string) ?? '').trim() || null
  const keywords = keyword ? [keyword] : []

  const baseSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`

  try {
    await createBrand({
      name,
      slug,
      keywords,
      domain,
      agencyManaged: true,
      subscriptionStatus: 'agency',
      invitedEmail: clientEmail,
      agencyId,
    })

    // Send invite email
    if (clientEmail) {
      try {
        const { sendInviteEmail } = await import('@/lib/email')
        await sendInviteEmail(clientEmail, name)
      } catch (err) {
        console.error('Invite email failed:', err instanceof Error ? err.message : err)
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return { error: 'A brand with that name already exists' }
    }
    console.error('Agency brand creation failed:', err)
    return { error: 'Failed to create brand' }
  }

  redirect('/agency')
}
