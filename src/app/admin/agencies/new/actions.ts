'use server'

import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { checkIsAdmin } from '@/lib/auth'
import { createAgency } from '@/lib/db/queries'

export type CreateAgencyState = { error?: string; success?: string } | null

export async function createAgencyAction(_prev: CreateAgencyState, formData: FormData): Promise<CreateAgencyState> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }
  if (!await checkIsAdmin()) return { error: 'Admin access required' }

  const name = ((formData.get('name') as string) ?? '').trim()
  const ownerEmail = ((formData.get('ownerEmail') as string) ?? '').trim()
  const contactName = ((formData.get('contactName') as string) ?? '').trim() || undefined

  if (!name) return { error: 'Agency name is required' }
  if (!ownerEmail) return { error: 'Owner email is required' }

  try {
    await createAgency({ name, ownerEmail, contactName })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return { error: 'An agency with that email already exists' }
    }
    return { error: 'Failed to create agency' }
  }

  redirect('/admin/agencies')
}
