import { NextResponse } from 'next/server'
import { isCronRequest } from '@/lib/auth'
import { isUKHour } from '@/lib/timezone'
import { getAllActiveBrands, getRecentSerpChecks, getCompetitorSummaryForBrand } from '@/lib/db/queries'
import { getUserEmail, sendWeeklyDigestEmail } from '@/lib/email'
import { acquireLock, releaseLock } from '@/lib/cron-lock'

export const maxDuration = 300

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isUKHour(8)) {
    return NextResponse.json({ skipped: true, reason: 'Not 8am UK time' })
  }

  const locked = await acquireLock('weekly-digest')
  if (!locked) return NextResponse.json({ skipped: true, reason: 'Another digest is running' })

  try {
    const brands = await getAllActiveBrands()
    const results = []

    for (const brand of brands) {
      try {
        if (!brand.userId) { results.push({ brand: brand.name, status: 'skipped' }); continue }
        const email = await getUserEmail(brand.userId)
        if (!email) { results.push({ brand: brand.name, status: 'skipped' }); continue }

        // Get this week's data
        const checks = await getRecentSerpChecks(brand.id, 500)
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

        const thisWeekChecks = checks.filter(c => new Date(c.checkedAt) >= weekAgo)
        const lastWeekChecks = checks.filter(c => new Date(c.checkedAt) >= twoWeeksAgo && new Date(c.checkedAt) < weekAgo)

        const competitors = await getCompetitorSummaryForBrand(brand.id)
        const thisWeekCompetitors = competitors.filter(c => c.lastSeen >= weekAgo)
        const lastWeekCompetitors = competitors.filter(c => c.lastSeen >= twoWeeksAgo && c.lastSeen < weekAgo)

        // Find new and stopped competitors
        const thisWeekDomains = new Set(thisWeekCompetitors.map(c => c.domain))
        const lastWeekDomains = new Set(lastWeekCompetitors.map(c => c.domain))
        const newCompetitors = [...thisWeekDomains].filter(d => !lastWeekDomains.has(d))
        const stoppedCompetitors = [...lastWeekDomains].filter(d => !thisWeekDomains.has(d))

        // Generate AI digest
        let aiDigest: string | null = null
        try {
          const { generateWeeklyDigest } = await import('@/lib/ai')
          aiDigest = await generateWeeklyDigest(brand.name, {
            checksThisWeek: thisWeekChecks.length,
            competitorsThisWeek: thisWeekCompetitors.map(c => ({ domain: c.domain, count: c.recentCount })),
            competitorsLastWeek: lastWeekCompetitors.length,
            newCompetitors,
            stoppedCompetitors,
          })
        } catch { /* AI unavailable */ }

        await sendWeeklyDigestEmail(email, brand.name, {
          checksThisWeek: thisWeekChecks.length,
          competitorsThisWeek: thisWeekCompetitors.length,
          newCompetitors,
          stoppedCompetitors,
          aiDigest,
        })

        results.push({ brand: brand.name, status: 'sent' })
      } catch (err) {
        console.error(`Weekly digest failed for ${brand.name}:`, err instanceof Error ? err.message : err)
        results.push({ brand: brand.name, status: 'error' })
      }
    }

    return NextResponse.json({ results })
  } finally {
    await releaseLock('weekly-digest')
  }
}
