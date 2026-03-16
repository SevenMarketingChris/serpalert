import { NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { isAdminRequest, isSafeOrigin } from '@/lib/auth'
import { updateBrandSettings } from '@/lib/db/queries'

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

  await updateBrandSettings(id, {
    agencyName: 'agencyName' in body ? (body.agencyName || null) : undefined,
    agencyLogoUrl: 'agencyLogoUrl' in body ? (body.agencyLogoUrl || null) : undefined,
    agencyPrimaryColor: 'agencyPrimaryColor' in body ? (body.agencyPrimaryColor || null) : undefined,
    reportEmail: 'reportEmail' in body ? (body.reportEmail || null) : undefined,
    avgBrandCpc: 'avgBrandCpc' in body ? (body.avgBrandCpc != null ? Number(body.avgBrandCpc) : null) : undefined,
    monthlyBrandSearches: 'monthlyBrandSearches' in body ? (body.monthlyBrandSearches != null ? Number(body.monthlyBrandSearches) : null) : undefined,
  })

  return NextResponse.json({ ok: true })
}
