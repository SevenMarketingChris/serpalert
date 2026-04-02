import { NextResponse } from 'next/server'
import { isCronRequest } from '@/lib/auth'
import { isUKHour } from '@/lib/timezone'
import { getScreenshotUrlsOlderThan, nullifyScreenshotUrls } from '@/lib/db/queries'
import { deleteScreenshotFiles } from '@/lib/blob-storage'
import { acquireLock, releaseLock } from '@/lib/cron-lock'

export const maxDuration = 60

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isUKHour(3)) {
    return NextResponse.json({ skipped: true, reason: 'Not 3am UK time' })
  }

  const locked = await acquireLock('cleanup-screenshots')
  if (!locked) {
    return NextResponse.json({ skipped: true, reason: 'Another cleanup is running' })
  }

  try {
    const DAYS = 30
    const old = await getScreenshotUrlsOlderThan(DAYS)

    if (old.length === 0) {
      return NextResponse.json({ deleted: 0, message: 'Nothing to clean up' })
    }

    const urls = old.map(r => r.screenshotUrl)
    const ids = old.map(r => r.id)

    // Delete blobs and nullify DB references in batches — partial failures don't block remaining batches
    for (let i = 0; i < urls.length; i += 25) {
      const batch = urls.slice(i, i + 25)
      const batchIds = ids.slice(i, i + 25)
      try {
        await deleteScreenshotFiles(batch)
        await nullifyScreenshotUrls(batchIds)
      } catch (err) {
        console.error(`Screenshot cleanup batch ${i / 25} failed:`, err instanceof Error ? err.message : err)
        // Continue with remaining batches
      }
    }

    return NextResponse.json({
      deleted: ids.length,
      message: `Cleaned up ${ids.length} screenshots older than ${DAYS} days`,
    })
  } finally {
    await releaseLock('cleanup-screenshots')
  }
}
