import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { ensureAttributionCookies } from '@/lib/attribution'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const response = NextResponse.next()
  ensureAttributionCookies(req, response)

  if (isProtectedRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.url)
      const redirectResponse = NextResponse.redirect(signInUrl)
      ensureAttributionCookies(req, redirectResponse)
      return redirectResponse
    }
    // Admin role check is handled server-side by AdminLayout using checkIsAdmin()
    // which verifies the user's email against the ADMIN_EMAILS allowlist
  }

  return response
})

export const config = {
  matcher: [
    '/((?!_next|api/webhooks|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/((?!api/webhooks)api|trpc)(.*)',
  ],
}
