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
  const email = user.emailAddresses?.[0]?.emailAddress
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

/**
 * Sync check for middleware/proxy context where currentUser() isn't available.
 * Falls back to publicMetadata.role check.
 */
export function isAdminFromClaims(sessionClaims: Record<string, unknown> | null | undefined): boolean {
  if (!sessionClaims) return false
  const role = (sessionClaims as { publicMetadata?: { role?: string } })?.publicMetadata?.role
  return role === 'admin'
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
