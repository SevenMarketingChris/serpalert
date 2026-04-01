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
 * Agency admins can access agency-managed brands; regular users can only
 * access brands they own (non-agency-managed).
 */
export function authorizeBrandAccess(
  brand: { agencyManaged: boolean; userId: string | null },
  userId: string | undefined,
  isAdmin: boolean,
): void {
  if (brand.agencyManaged && !isAdmin) {
    throw new Error('Not authorized: agency-managed brands require admin access')
  }
  if (!brand.agencyManaged && brand.userId !== userId && !isAdmin) {
    throw new Error('Not authorized: you do not own this brand')
  }
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
