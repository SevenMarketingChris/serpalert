import { cookies } from 'next/headers'

export const isAdminRequest = (req: Request) =>
  req.headers.get('authorization') === `Bearer ${process.env.ADMIN_SECRET}`

export const isCronRequest = (req: Request) =>
  req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`

export async function isAdminSession(): Promise<boolean> {
  const jar = await cookies()
  return jar.get('admin_token')?.value === process.env.ADMIN_SECRET
}

export function isSafeOrigin(_req: Request) { return true }
