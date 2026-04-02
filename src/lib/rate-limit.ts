import { neon } from '@neondatabase/serverless'

/**
 * Postgres-backed rate limiter — works across Vercel serverless instances.
 * Uses a simple insert + count pattern with automatic cleanup of expired entries.
 */

let tableEnsured = false

async function ensureTable(sql: ReturnType<typeof neon<false, false>>) {
  if (tableEnsured) return
  await sql`
    CREATE TABLE IF NOT EXISTS rate_limits (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS rate_limits_key_created_idx ON rate_limits (key, created_at)
  `
  tableEnsured = true
}

export async function rateLimit(
  key: string,
  { limit = 60, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): Promise<{ ok: boolean; remaining: number }> {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.warn('rate-limit: DATABASE_URL not set, failing open')
    return { ok: true, remaining: limit }
  }

  const sql = neon(url)

  try {
    await ensureTable(sql)

    // Insert this request
    await sql`INSERT INTO rate_limits (key, created_at) VALUES (${key}, now())`

    // Count hits in the current window
    const windowStart = new Date(Date.now() - windowMs).toISOString()
    const rows = await sql`
      SELECT COUNT(*)::int AS count FROM rate_limits
      WHERE key = ${key} AND created_at >= ${windowStart}::timestamptz
    `
    const count = rows[0]?.count ?? 0

    // Clean up expired entries (fire-and-forget)
    sql`DELETE FROM rate_limits WHERE created_at < ${windowStart}::timestamptz`.catch(() => {})

    if (count > limit) {
      return { ok: false, remaining: 0 }
    }

    return { ok: true, remaining: limit - count }
  } catch (err) {
    console.error('rate-limit: DB error, failing open:', err)
    return { ok: true, remaining: limit }
  }
}
