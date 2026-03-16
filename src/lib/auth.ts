export const isAdminRequest = (req: Request) =>
  req.headers.get('authorization') === `Bearer ${process.env.ADMIN_SECRET}`

export const isCronRequest = (req: Request) =>
  req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`

/**
 * CSRF guard for state-mutating API routes.
 * Rejects requests where Origin/Referer don't match the app's host.
 * Bearer-authenticated requests (admin/cron) are exempt.
 */
export const isSafeOrigin = (req: Request): boolean => {
  // Bearer-authed requests are machine-to-machine — no CSRF risk
  if (isAdminRequest(req) || isCronRequest(req)) return true

  const appHost = process.env.NEXTAUTH_URL
    ? new URL(process.env.NEXTAUTH_URL).host
    : null

  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')

  const check = origin ?? referer
  if (!check) return false // no origin header — reject
  if (!appHost) return true // can't verify in dev without NEXTAUTH_URL

  try {
    return new URL(check).host === appHost
  } catch {
    return false
  }
}
