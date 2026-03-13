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

  // Cron/API routes — allow bearer token
  if (pathname.startsWith('/api/') && req.headers.get('authorization')?.startsWith('Bearer ')) {
    return NextResponse.next()
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
