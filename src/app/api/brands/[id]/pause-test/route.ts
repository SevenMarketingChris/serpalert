import { NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { isAdminRequest } from '@/lib/auth'
import { createPauseTest, endPauseTest, getActivePauseTest, getCompetitorCount30Days } from '@/lib/db/queries'

async function isAuthorised(request: Request) {
  if (isAdminRequest(request)) return true
  const session = await auth()
  return !!session?.user
}

// POST — start a new pause test (captures current 30-day exposure as baseline)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAuthorised(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const { totalChecks, checksWithCompetitors } = await getCompetitorCount30Days(id)
  const baselineRate = totalChecks > 0 ? checksWithCompetitors / totalChecks : 0

  const test = await createPauseTest(id, baselineRate, body.notes)
  return NextResponse.json({ ok: true, test })
}

// PATCH — end the active pause test
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAuthorised(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const active = await getActivePauseTest(id)
  if (!active) return NextResponse.json({ error: 'No active pause test' }, { status: 404 })

  const { totalChecks, checksWithCompetitors } = await getCompetitorCount30Days(id)
  const duringRate = totalChecks > 0 ? checksWithCompetitors / totalChecks : 0

  await endPauseTest(active.id, duringRate)
  return NextResponse.json({ ok: true })
}
