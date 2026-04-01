import type { NextRequest, NextResponse } from 'next/server'

export const ATTRIBUTION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days
export const SESSION_MAX_AGE_SECONDS = 60 * 30 // 30 minutes

export const ATTRIBUTION_COOKIES = {
  anonymousId: 'sa_anon_id',
  sessionId: 'sa_session_id',
  firstTouch: 'sa_attr_ft',
  lastTouch: 'sa_attr_lt',
} as const

export interface AttributionTouchpoint {
  source: string
  medium: string
  campaign?: string
  term?: string
  content?: string
  referrer?: string
  landingPath: string
  gclid?: string
  fbclid?: string
  capturedAt: string
}

export interface AttributionContext {
  anonymousId: string
  sessionId: string
  firstTouch: AttributionTouchpoint | null
  lastTouch: AttributionTouchpoint | null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function asUuidOrUndefined(value: string | undefined): string | undefined {
  if (!value) return undefined
  return UUID_RE.test(value) ? value : undefined
}

function encodePayload(payload: AttributionTouchpoint): string {
  return encodeURIComponent(JSON.stringify(payload))
}

function decodePayload(value: string | undefined): AttributionTouchpoint | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as AttributionTouchpoint
    if (!parsed || typeof parsed !== 'object') return null
    if (!parsed.source || !parsed.medium || !parsed.landingPath || !parsed.capturedAt) return null
    return parsed
  } catch {
    return null
  }
}

function parseCookieHeader(headerValue: string | null): Record<string, string> {
  if (!headerValue) return {}
  const pairs = headerValue.split(';')
  const result: Record<string, string> = {}
  for (const pair of pairs) {
    const idx = pair.indexOf('=')
    if (idx === -1) continue
    const key = pair.slice(0, idx).trim()
    const value = pair.slice(idx + 1).trim()
    if (!key) continue
    result[key] = value
  }
  return result
}

function normalizeReferrer(referrer: string | null, requestOrigin: string): string | undefined {
  if (!referrer) return undefined
  try {
    const refUrl = new URL(referrer)
    const reqUrl = new URL(requestOrigin)
    if (refUrl.host === reqUrl.host) return undefined
    return refUrl.origin + refUrl.pathname
  } catch {
    return undefined
  }
}

function parseIncomingTouchpoint(req: Request): AttributionTouchpoint | null {
  const url = new URL(req.url)
  const q = url.searchParams

  const utmSource = q.get('utm_source')?.trim() || undefined
  const utmMedium = q.get('utm_medium')?.trim() || undefined
  const utmCampaign = q.get('utm_campaign')?.trim() || undefined
  const utmTerm = q.get('utm_term')?.trim() || undefined
  const utmContent = q.get('utm_content')?.trim() || undefined
  const gclid = q.get('gclid')?.trim() || undefined
  const fbclid = q.get('fbclid')?.trim() || undefined

  const referrer = normalizeReferrer(req.headers.get('referer'), url.origin)
  const hasUtm = Boolean(utmSource || utmMedium || utmCampaign || utmTerm || utmContent)
  const hasClickId = Boolean(gclid || fbclid)
  const hasReferrer = Boolean(referrer)

  if (!hasUtm && !hasClickId && !hasReferrer) {
    return null
  }

  return {
    source: utmSource ?? (gclid ? 'google' : fbclid ? 'facebook' : referrer ? 'referrer' : 'direct'),
    medium: utmMedium ?? (gclid ? 'cpc' : fbclid ? 'paid_social' : referrer ? 'referral' : 'none'),
    campaign: utmCampaign,
    term: utmTerm,
    content: utmContent,
    referrer,
    landingPath: url.pathname,
    gclid,
    fbclid,
    capturedAt: new Date().toISOString(),
  }
}

function buildDirectTouchpoint(req: Request): AttributionTouchpoint {
  const url = new URL(req.url)
  return {
    source: 'direct',
    medium: 'none',
    landingPath: url.pathname,
    capturedAt: new Date().toISOString(),
  }
}

function setAttributionCookie(
  response: NextResponse,
  name: string,
  value: string,
  maxAge: number,
): void {
  response.cookies.set({
    name,
    value,
    maxAge,
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
  })
}

function setIdCookie(
  response: NextResponse,
  name: string,
  value: string,
  maxAge: number,
): void {
  response.cookies.set({
    name,
    value,
    maxAge,
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
  })
}

export function ensureAttributionCookies(req: NextRequest, response: NextResponse): AttributionContext {
  let anonymousId = asUuidOrUndefined(req.cookies.get(ATTRIBUTION_COOKIES.anonymousId)?.value)
  if (!anonymousId) {
    anonymousId = crypto.randomUUID()
  }

  let sessionId = asUuidOrUndefined(req.cookies.get(ATTRIBUTION_COOKIES.sessionId)?.value)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
  }

  const existingFirstTouch = decodePayload(req.cookies.get(ATTRIBUTION_COOKIES.firstTouch)?.value)
  const existingLastTouch = decodePayload(req.cookies.get(ATTRIBUTION_COOKIES.lastTouch)?.value)

  const incomingTouch = parseIncomingTouchpoint(req)
  const firstTouch = existingFirstTouch ?? incomingTouch ?? buildDirectTouchpoint(req)
  const lastTouch = incomingTouch ?? existingLastTouch ?? firstTouch

  setIdCookie(response, ATTRIBUTION_COOKIES.anonymousId, anonymousId, ATTRIBUTION_MAX_AGE_SECONDS)
  setIdCookie(response, ATTRIBUTION_COOKIES.sessionId, sessionId, SESSION_MAX_AGE_SECONDS)
  setAttributionCookie(response, ATTRIBUTION_COOKIES.firstTouch, encodePayload(firstTouch), ATTRIBUTION_MAX_AGE_SECONDS)
  setAttributionCookie(response, ATTRIBUTION_COOKIES.lastTouch, encodePayload(lastTouch), ATTRIBUTION_MAX_AGE_SECONDS)

  return {
    anonymousId,
    sessionId,
    firstTouch,
    lastTouch,
  }
}

export function readAttributionContextFromRequest(req: Request): AttributionContext {
  return readAttributionContextFromCookieHeader(req.headers.get('cookie'))
}

export function readAttributionContextFromCookieHeader(cookieHeader: string | null): AttributionContext {
  const cookies = parseCookieHeader(cookieHeader)

  const anonymousId = asUuidOrUndefined(cookies[ATTRIBUTION_COOKIES.anonymousId]) ?? 'unknown'
  const sessionId = asUuidOrUndefined(cookies[ATTRIBUTION_COOKIES.sessionId]) ?? 'unknown'
  const firstTouch = decodePayload(cookies[ATTRIBUTION_COOKIES.firstTouch])
  const lastTouch = decodePayload(cookies[ATTRIBUTION_COOKIES.lastTouch])

  return {
    anonymousId,
    sessionId,
    firstTouch,
    lastTouch,
  }
}
