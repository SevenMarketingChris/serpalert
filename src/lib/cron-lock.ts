import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

/**
 * Database-based cron lock using PostgreSQL advisory locks.
 * Survives process restarts unlike the previous in-memory Set.
 */

// Stable hash: convert job name to a 32-bit integer for pg_try_advisory_lock
function jobNameToLockId(jobName: string): number {
  let hash = 0
  for (let i = 0; i < jobName.length; i++) {
    hash = ((hash << 5) - hash + jobName.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export async function acquireLock(jobName: string): Promise<boolean> {
  const lockId = jobNameToLockId(jobName)
  try {
    const result = await db.execute(
      sql`SELECT pg_try_advisory_lock(${lockId}) AS acquired`
    )
    const row = (result as unknown as { acquired: boolean }[])[0]
    return row?.acquired === true
  } catch (err) {
    console.error(`Failed to acquire advisory lock for "${jobName}":`, err)
    return false
  }
}

export async function releaseLock(jobName: string): Promise<void> {
  const lockId = jobNameToLockId(jobName)
  try {
    await db.execute(sql`SELECT pg_advisory_unlock(${lockId})`)
  } catch (err) {
    console.error(`Failed to release advisory lock for "${jobName}":`, err)
  }
}
