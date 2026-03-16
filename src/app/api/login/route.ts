import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { password } = await req.json()
  if (password !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }
  const jar = await cookies()
  jar.set('admin_token', process.env.ADMIN_SECRET!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return NextResponse.json({ ok: true })
}
