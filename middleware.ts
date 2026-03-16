import { auth } from './auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Public routes — no auth needed
  if (
    pathname.startsWith('/client/') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/cron') ||
    pathname === '/' ||
    pathname === '/unauthorized'
  ) {
    return NextResponse.next()
  }

  // API routes — allow only with a known valid bearer token (admin or cron secret)
  if (pathname.startsWith('/api/') && req.headers.get('authorization')?.startsWith('Bearer ')) {
    const token = req.headers.get('authorization')!.slice(7)
    const validTokens = [process.env.ADMIN_SECRET, process.env.CRON_SECRET].filter(Boolean)
    if (validTokens.includes(token)) return NextResponse.next()
    // Unknown bearer — fall through to session check below
  }

  // Everything else requires Google session
  if (!req.auth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
