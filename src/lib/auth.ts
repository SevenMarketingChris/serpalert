import { timingSafeEqual, createHash } from 'crypto'

function safeCompare(a: string, b: string): boolean {
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

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '').split(',').map(s => s.trim()).filter(Boolean)
}

export function getAllowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? '').split(',').map(s => s.trim()).filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const admins = getAdminEmails()
  if (admins.length === 0) return false
  return admins.some(a => a.toLowerCase() === email.toLowerCase())
}

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAllowedEmails().some(a => a.toLowerCase() === email.toLowerCase())
}
