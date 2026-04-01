import { NextResponse } from 'next/server'
import { db, brands } from '@/lib/db'
import { count } from 'drizzle-orm'
import { isAdminRequest, isCronRequest } from '@/lib/auth'

function notFoundResponse() {
  return NextResponse.json(
    { error: 'Not found' },
    { status: 404, headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function GET(request: Request) {
  if (!isAdminRequest(request) && !isCronRequest(request)) {
    return notFoundResponse()
  }

  try {
    await db.select({ count: count() }).from(brands).limit(1)
    return NextResponse.json(
      { status: 'ok' },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    return NextResponse.json(
      { status: 'error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
