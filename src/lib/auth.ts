import { timingSafeEqual } from 'crypto'

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    return bufA.length === bufB.length && timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
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
