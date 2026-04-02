// CSRF: Protected by Clerk's SameSite=Lax cookies for REST endpoints
// and Next.js Server Actions' built-in CSRF tokens for form mutations.

import { timingSafeEqual, createHash } from 'crypto'

const ADMIN_EMAILS = ['chris@sevenmarketing.co.uk']

/**
 * Check if a Clerk user is an admin by email.
 * Call from Server Components / Server Actions (not middleware).
 */
export async function checkIsAdmin(): Promise<boolean> {
  const { currentUser } = await import('@clerk/nextjs/server')
  const user = await currentUser()
  if (!user) return false
  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

/**
 * Sync check for middleware/proxy context.
 * Checks email from session claims OR publicMetadata.role.
 */
export function isAdminFromClaims(sessionClaims: Record<string, unknown> | null | undefined): boolean {
  if (!sessionClaims) return false
  // Check email from Clerk JWT claims
  const claims = sessionClaims as {
    email?: string
    primaryEmail?: string
    publicMetadata?: { role?: string }
  }
  const email = (claims.email || claims.primaryEmail || '').toLowerCase()
  if (email && ADMIN_EMAILS.includes(email)) return true
  // Fallback to metadata role
  return claims.publicMetadata?.role === 'admin'
}

/**
 * Assert that the current user is authorized to access the given brand.
 * Super admins can access everything, agency users can access their own
 * agency's brands, regular users can access brands they own.
 */
export function authorizeBrandAccess(
  brand: { agencyManaged: boolean; userId: string | null; agencyId?: string | null },
  userId: string | undefined,
  isAdmin: boolean,
  userAgencyId?: string | null,
): void {
  if (isAdmin) return
  if (userAgencyId && brand.agencyId === userAgencyId && brand.agencyManaged) return
  if (brand.userId === userId) return
  throw new Error('Not authorized')
}

/**
 * Check if the current user is an agency admin.
 */
export async function checkIsAgencyAdmin(): Promise<{ isAgency: boolean; agencyId: string | null; email: string | null }> {
  const { currentUser } = await import('@clerk/nextjs/server')
  const user = await currentUser()
  if (!user) return { isAgency: false, agencyId: null, email: null }
  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress
  if (!email) return { isAgency: false, agencyId: null, email: null }

  // Check if this email is an agency owner
  const { getAgencyByOwnerEmail } = await import('@/lib/db/queries')
  const agency = await getAgencyByOwnerEmail(email)
  if (agency && agency.active) {
    return { isAgency: true, agencyId: agency.id, email }
  }
  return { isAgency: false, agencyId: null, email }
}

export function safeCompare(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest()
  const hashB = createHash('sha256').update(b).digest()
  return timingSafeEqual(hashA, hashB)
}

export const isAdminRequest = (req: Request) => {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  return safeCompare(req.headers.get('authorization') ?? '', `Bearer ${secret}`)
}

export const isCronRequest = (req: Request) => {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return safeCompare(req.headers.get('authorization') ?? '', `Bearer ${secret}`)
}
