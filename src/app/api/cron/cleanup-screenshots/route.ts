import { NextResponse } from 'next/server'
import { isCronRequest } from '@/lib/auth'
import { getScreenshotUrlsOlderThan, nullifyScreenshotUrls } from '@/lib/db/queries'
import { deleteScreenshotFiles } from '@/lib/blob-storage'
import { acquireLock, releaseLock } from '@/lib/cron-lock'

export const maxDuration = 60

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Delete blobs in chunks of 25 to avoid rate limits and timeouts
    for (let i = 0; i < urls.length; i += 25) {
      await deleteScreenshotFiles(urls.slice(i, i + 25))
    }
    // Only then nullify DB references
    await nullifyScreenshotUrls(ids)

    return NextResponse.json({
      deleted: ids.length,
      message: `Cleaned up ${ids.length} screenshots older than ${DAYS} days`,
    })
  } finally {
    await releaseLock('cleanup-screenshots')
  }
}
