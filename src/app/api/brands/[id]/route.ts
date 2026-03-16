import { NextResponse } from 'next/server'
import { isAdminRequest, isSafeOrigin } from '@/lib/auth'
import { updateBrandActive, updateBrandRoas } from '@/lib/db/queries'
import { auth } from '../../../../../auth'

async function isAuthorised(request: Request) {
  if (isAdminRequest(request)) return true
  const session = await auth()
  return !!session?.user
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAuthorised(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isSafeOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const body = await request.json()
  if (typeof body.active === 'boolean') {
    await updateBrandActive(id, body.active)
  }
  if ('monthlyBrandSpend' in body || 'brandRoas' in body) {
    await updateBrandRoas(
      id,
      body.monthlyBrandSpend != null ? Number(body.monthlyBrandSpend) : null,
      body.brandRoas != null ? Number(body.brandRoas) : null,
    )
  }
  return NextResponse.json({ ok: true })
}
