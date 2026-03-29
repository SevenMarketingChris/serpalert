/**
 * Per-instance in-memory rate limiter.
 *
 * NOTE: This does NOT work across serverless instances — each instance
 * has its own counter. For this internal tool without public auth,
 * this is acceptable. A burst across many cold-started instances could
 * bypass the limit, but the manual check endpoint requires knowing a
 * valid brand UUID which limits the attack surface.
 *
 * For production with public auth, replace with @upstash/ratelimit + Redis.
 */

const hits = new Map<string, { count: number; resetAt: number }>()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of hits) {
    if (entry.resetAt < now) hits.delete(key)
  }
}, 5 * 60 * 1000).unref?.()

export function rateLimit(
  key: string,
  { limit = 60, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): { ok: boolean; remaining: number } {
  const now = Date.now()
  const entry = hits.get(key)

  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1 }
  }

  entry.count++
  if (entry.count > limit) {
    return { ok: false, remaining: 0 }
  }

  return { ok: true, remaining: limit - entry.count }
}
