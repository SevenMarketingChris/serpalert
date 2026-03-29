import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { screenshotSerp } from '@/lib/puppeteer'

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const keyword = new URL(request.url).searchParams.get('q') || 'test'

  try {
    const buffer = await screenshotSerp(keyword)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="screenshot.png"`,
      },
    })
  } catch (err) {
    console.error('[test-screenshot] Failed:', err)
    return NextResponse.json({ error: 'Screenshot failed' }, { status: 500 })
  }
}
