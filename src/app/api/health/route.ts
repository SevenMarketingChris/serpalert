import { NextResponse } from 'next/server'
import { db, brands } from '@/lib/db'
import { count } from 'drizzle-orm'

export async function GET() {
  try {
    // Just verify DB connectivity
    await db.select({ count: count() }).from(brands).limit(1)
    return NextResponse.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() }, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' } })
  } catch {
    return NextResponse.json({ status: 'error', database: 'disconnected' }, { status: 500 })
  }
}
