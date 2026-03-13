export const isAdminRequest = (req: Request) =>
  req.headers.get('authorization') === `Bearer ${process.env.ADMIN_SECRET}`

export const isCronRequest = (req: Request) =>
  req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
