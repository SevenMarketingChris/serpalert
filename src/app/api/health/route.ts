import { NextResponse } from 'next/server'
import { db, brands } from '@/lib/db'
import { count } from 'drizzle-orm'

export async function GET() {
  try {
    const rows = await db.select({ count: count() }).from(brands)
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      brandCount: rows[0]?.count ?? 0,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[health] DB check failed:', err)
    return NextResponse.json({ status: 'error', database: 'failed' }, { status: 500 })
  }
}
