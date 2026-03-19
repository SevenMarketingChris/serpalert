import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: string[] = []

  try {
    // Check and add user_id column
    const hasUserId = await db.execute(sql`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'brands' AND column_name = 'user_id'
    `)
    if (hasUserId.length === 0) {
      await db.execute(sql`ALTER TABLE brands ADD COLUMN IF NOT EXISTS user_id TEXT`)
      results.push('✓ Added user_id column')
    } else {
      results.push('✓ user_id already exists')
    }

    // Check and add plan column
    const hasPlan = await db.execute(sql`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'brands' AND column_name = 'plan'
    `)
    if (hasPlan.length === 0) {
      await db.execute(sql`ALTER TABLE brands ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'`)
      results.push('✓ Added plan column')
    } else {
      results.push('✓ plan already exists')
    }

    // Create index
    await db.execute(sql`CREATE INDEX IF NOT EXISTS brands_user_id_idx ON brands (user_id)`)
    results.push('✓ Index ensured')

    return NextResponse.json({ success: true, results })
  } catch (e) {
    const err = e as Record<string, unknown>
    return NextResponse.json({
      success: false,
      error: err?.message ?? String(e),
      code: err?.code,
      detail: err?.detail,
      hint: err?.hint,
      db_url_set: !!process.env.DATABASE_URL,
      db_url_prefix: process.env.DATABASE_URL?.slice(0, 40),
      results,
    }, { status: 500 })
  }
}
