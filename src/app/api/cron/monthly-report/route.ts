import { NextResponse } from 'next/server'
import { isCronRequest } from '@/lib/auth'
import { getAllActiveBrands, getCompetitorCount30Days, getCompetitorProfiles } from '@/lib/db/queries'
import { computeThreatScore } from '@/lib/threat-score'
import { sendMonthlyReport } from '@/lib/email'

export const maxDuration = 300

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  const period = `${monthStart.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`

  const brands = await getAllActiveBrands()
  const results = []

  for (const brand of brands) {
    if (!brand.reportEmail) continue
    try {
      const [{ totalChecks, checksWithCompetitors }, profiles] = await Promise.all([
        getCompetitorCount30Days(brand.id),
        getCompetitorProfiles(brand.id),
      ])

      const profilesWithScores = profiles.map(p => ({
        ...p,
        threat: computeThreatScore(p, totalChecks, brand.keywords.length),
      }))

      const activeCompetitors = profiles.filter(p => p.recentAppearances > 0).length

      await sendMonthlyReport({
        to: brand.reportEmail,
        brandName: brand.name,
        agencyName: brand.agencyName,
        clientToken: brand.clientToken,
        period,
        totalScans: totalChecks,
        checksWithCompetitors,
        activeCompetitors,
        totalCompetitors: profiles.length,
        spend: brand.monthlyBrandSpend ? parseFloat(brand.monthlyBrandSpend) : null,
        roas: brand.brandRoas ? parseFloat(brand.brandRoas) : null,
        topCompetitors: profilesWithScores.slice(0, 5).map(p => ({
          domain: p.domain,
          appearances: p.totalAppearances,
          isEscalating: p.threat.isEscalating,
        })),
      })

      results.push({ brand: brand.name, email: brand.reportEmail, status: 'sent' })
    } catch (err) {
      console.error(`Monthly report failed for ${brand.name}:`, err)
      results.push({ brand: brand.name, status: 'error', error: String(err) })
    }
  }

  return NextResponse.json({ results, period })
}
