import { NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { isAdminRequest } from '@/lib/auth'
import { getBrandById, getCompetitorProfiles, getCompetitorCount30Days, getRecentAdSamples } from '@/lib/db/queries'

async function isAuthorised(request: Request) {
  if (isAdminRequest(request)) return true
  const session = await auth()
  return !!session?.user
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAuthorised(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const brand = await getBrandById(id)
  if (!brand) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [profiles, { totalChecks, checksWithCompetitors }] = await Promise.all([
    getCompetitorProfiles(id),
    getCompetitorCount30Days(id),
  ])

  // Fetch ad samples for top 3 competitors by appearance count
  const top3 = profiles.slice(0, 3)
  const adSampleEntries = await Promise.all(
    top3.map(async p => [p.domain, await getRecentAdSamples(id, p.domain, 2)] as const)
  )
  const adSamples = Object.fromEntries(adSampleEntries)

  return NextResponse.json({
    brand,
    totalChecks30d: totalChecks,
    checksWithCompetitors30d: checksWithCompetitors,
    profiles,
    adSamples,
  })
}
