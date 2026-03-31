import { NextResponse } from 'next/server'
import { isCronRequest } from '@/lib/auth'
import { getAllActiveBrands, getRecentSerpChecks, getCompetitorSummaryForBrand, getScreenshotsForBrand } from '@/lib/db/queries'
import { getUserEmail, sendMonthlyReport } from '@/lib/email'

export const maxDuration = 300

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

      // Gather 30-day data
      const checks = await getRecentSerpChecks(brand.id, 1000)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentChecks = checks.filter(c => new Date(c.checkedAt) >= thirtyDaysAgo)

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

      await sendMonthlyReport(email, brand.name, {
        totalChecks: recentChecks.length,
        newCompetitors: competitorList,
        mostActiveCompetitor: mostActive,
        keywordsMonitored: brand.keywords.length,
        screenshotCount: screenshots.length,
        screenshotUrls,
      })

      results.push({ brand: brand.name, status: 'sent' })
    } catch (err) {
      console.error(`Monthly report failed for ${brand.name}:`, err)
      results.push({ brand: brand.name, status: 'error' })
    }
  }

  return NextResponse.json({ results })
}
