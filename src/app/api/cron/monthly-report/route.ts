import { NextResponse } from 'next/server'
import { isCronRequest } from '@/lib/auth'
import { acquireLock, releaseLock } from '@/lib/cron-lock'
import { getAllActiveBrands, getRecentSerpChecks, getCompetitorSummaryForBrand, getScreenshotsForBrand } from '@/lib/db/queries'
import { getUserEmail, sendMonthlyReport } from '@/lib/email'

export const maxDuration = 300

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await acquireLock('monthly-report'))) {
    return NextResponse.json({ error: 'Already running' }, { status: 409 })
  }

  try {
    const brands = await getAllActiveBrands()
    const results = []

    for (const brand of brands) {
      try {
        // Get user email (skip agency brands without userId)
        if (!brand.userId) {
          results.push({ brand: brand.name, status: 'skipped', reason: 'no userId' })
          continue
        }

        const email = await getUserEmail(brand.userId)
        if (!email) {
          results.push({ brand: brand.name, status: 'skipped', reason: 'no email' })
          continue
        }

        // Gather 30-day data (filter in SQL, not JS)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const recentChecks = await getRecentSerpChecks(brand.id, 1000, thirtyDaysAgo)

        const competitors = await getCompetitorSummaryForBrand(brand.id)
        const screenshots = await getScreenshotsForBrand(brand.id, 10)

        // Build competitor list sorted by recent count
        const competitorList = competitors
          .filter(c => c.recentCount > 0)
          .sort((a, b) => b.recentCount - a.recentCount)
          .map(c => ({ domain: c.domain, count: c.recentCount }))

        const mostActive = competitorList.length > 0 ? competitorList[0].domain : null

        // Get top 3 screenshot URLs (most recent with competitors)
        const screenshotUrls = screenshots
          .filter(s => s.screenshotUrl && s.competitorCount > 0)
          .slice(0, 3)
          .map(s => s.screenshotUrl!)

        // Generate AI monthly insights
        let aiInsights: string | null = null
        try {
          const { generateMonthlyInsights } = await import('@/lib/ai')
          aiInsights = await generateMonthlyInsights(brand.name, {
            totalChecks: recentChecks.length,
            competitors: competitorList,
            previousMonthCompetitors: 0, // simplified - could query prev month
            keywordsMonitored: brand.keywords.length,
          })
        } catch {
          // AI unavailable
        }

        // Generate bid timing analysis
        let bidTimingInsight: string | null = null
        try {
          const { analyzeBidTiming } = await import('@/lib/ai')
          const checksWithCompetitors = recentChecks.filter(c => c.competitorCount > 0)
          if (checksWithCompetitors.length > 0) {
            const timestamps = checksWithCompetitors.slice(0, 50).map(c => ({
              domain: 'competitor',
              checkedAt: new Date(c.checkedAt).toISOString(),
            }))
            bidTimingInsight = await analyzeBidTiming(brand.name, timestamps)
          }
        } catch { /* AI unavailable */ }

        // Generate competitive landscape
        let landscapeReport: string | null = null
        try {
          const { generateCompetitiveLandscape } = await import('@/lib/ai')
          landscapeReport = await generateCompetitiveLandscape(brand.name, {
            totalChecks: recentChecks.length,
            competitors: competitorList.map(c => ({ ...c, avgPosition: null })),
            keywordsMonitored: brand.keywords.length,
            monthName: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
          })
        } catch { /* AI unavailable */ }

        await sendMonthlyReport(email, brand.name, {
          totalChecks: recentChecks.length,
          newCompetitors: competitorList,
          mostActiveCompetitor: mostActive,
          keywordsMonitored: brand.keywords.length,
          screenshotCount: screenshots.length,
          screenshotUrls,
        }, aiInsights, bidTimingInsight, landscapeReport)

        results.push({ brand: brand.name, status: 'sent' })
      } catch (err) {
        console.error(`Monthly report failed for ${brand.name}:`, err)
        results.push({ brand: brand.name, status: 'error' })
      }
    }

    return NextResponse.json({ results })
  } finally {
    await releaseLock('monthly-report')
  }
}
