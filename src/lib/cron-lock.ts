import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

const LOCK_TIMEOUT_MINUTES = 10

/**
 * Table-based cron lock suitable for serverless environments.
 * Uses a cron_locks table instead of PostgreSQL advisory locks,
 * which are connection-scoped and unreliable on serverless.
 *
 * The table must exist:
 *   CREATE TABLE IF NOT EXISTS cron_locks (
 *     job_name TEXT PRIMARY KEY,
 *     locked_at TIMESTAMP NOT NULL DEFAULT now()
 *   );
 */

export async function acquireLock(jobName: string): Promise<boolean> {
  try {
    // Ensure the table exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cron_locks (
        job_name TEXT PRIMARY KEY,
        locked_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `)

    // Delete stale locks older than the timeout
    const minutes = Math.floor(Math.abs(LOCK_TIMEOUT_MINUTES))
    await db.execute(sql`
      DELETE FROM cron_locks
      WHERE job_name = ${jobName}
        AND locked_at < now() - (${minutes} * INTERVAL '1 minute')
    `)

    // Try to insert a new lock row; if it already exists the INSERT fails
    await db.execute(sql`
      INSERT INTO cron_locks (job_name, locked_at)
      VALUES (${jobName}, now())
    `)

    return true
  } catch (err) {
    // Unique violation (23505) means lock is already held
    const pgErr = err as { code?: string }
    if (pgErr.code === '23505') {
      return false
    }
    console.error(`Failed to acquire lock for "${jobName}":`, err)
    return false
  }
}

export async function releaseLock(jobName: string): Promise<void> {
  try {
    await db.execute(sql`
      DELETE FROM cron_locks WHERE job_name = ${jobName}
    `)
  } catch (err) {
    console.error(`Failed to release lock for "${jobName}":`, err)
  }
}
