import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import postgres from 'postgres'

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(process.env.DATABASE_URL!)
  const sql = postgres({
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1),
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ssl: 'require',
    prepare: false,
  })
  try {
    await sql`ALTER TABLE brands ADD COLUMN IF NOT EXISTS monthly_brand_spend numeric`
    await sql`ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_roas numeric`
    return NextResponse.json({ ok: true, message: 'Migration applied' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    await sql.end()
  }
}
