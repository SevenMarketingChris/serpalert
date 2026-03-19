import { NextResponse } from 'next/server'
import { isCronRequest } from '@/lib/auth'
import { getScreenshotUrlsOlderThan, nullifyScreenshotUrls } from '@/lib/db/queries'
import { deleteScreenshotFiles } from '@/lib/supabase-storage'

export const maxDuration = 60

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const DAYS = 30
  const old = await getScreenshotUrlsOlderThan(DAYS)

  if (old.length === 0) {
    return NextResponse.json({ deleted: 0, message: 'Nothing to clean up' })
  }

  const urls = old.map(r => r.screenshotUrl)
  const ids = old.map(r => r.id)

  try {
    await deleteScreenshotFiles(urls)
  } catch (err) {
    console.error('Storage deletion failed:', err)
    // Still null out the DB references so we don't retry broken URLs
  }

  await nullifyScreenshotUrls(ids)

  return NextResponse.json({
    deleted: ids.length,
    message: `Cleaned up ${ids.length} screenshots older than ${DAYS} days`,
  })
}
