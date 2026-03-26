import { notFound, redirect } from 'next/navigation'
import { getBrandById, getRecentSerpChecks, getCompetitorAdsForChecks } from '@/lib/db/queries'
import { auth } from '../../../../auth'
import { isAdminEmail } from '@/lib/auth'
import { StatusHero } from '@/components/status-hero'
import { MetricCards } from '@/components/metric-cards'
import { DashboardTabs } from '@/components/dashboard-tabs'
import { ActivityFeed } from '@/components/activity-feed'

export default async function BrandDashboard({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params
  const session = await auth()
  if (!session) redirect('/login')

  const brand = await getBrandById(brandId)
  if (!brand) notFound()

  const isAdmin = isAdminEmail(session.user?.email ?? '')

  const checks = await getRecentSerpChecks(brandId, 100)
  const todayStr = new Date().toDateString()
  const checksToday = checks.filter(c => new Date(c.checkedAt).toDateString() === todayStr)
  const allAds = await getCompetitorAdsForChecks(checks.map(c => c.id))
  const threatsToday = new Set(
    allAds.filter(a => {
      const check = checks.find(c => c.id === a.serpCheckId)
      return check && new Date(check.checkedAt).toDateString() === todayStr
    }).map(a => a.domain)
  ).size

  // Build 7-day threat counts
  const last7Days: number[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dayStr = d.toDateString()
    const dayChecks = checks.filter(c => new Date(c.checkedAt).toDateString() === dayStr)
    const dayCheckIds = dayChecks.map(c => c.id)
    last7Days.push(allAds.filter(a => dayCheckIds.includes(a.serpCheckId)).length)
  }

  const lastCheckAt = checks[0]?.checkedAt ? new Date(checks[0].checkedAt).toISOString() : null

  const checksWithAds = checks.map(c => ({
    id: c.id,
    keyword: c.keyword,
    checkedAt: new Date(c.checkedAt).toISOString(),
    competitorCount: c.competitorCount,
    screenshotUrl: c.screenshotUrl ?? null,
    ads: allAds.filter(a => a.serpCheckId === c.id).map(a => ({
      id: a.id,
      domain: a.domain,
      headline: a.headline,
      description: a.description,
      displayUrl: a.displayUrl,
      position: a.position,
      status: a.status,
    })),
  }))

  return (
    <div className="space-y-4 max-w-5xl">
      <StatusHero brandId={brandId} threatsToday={threatsToday} lastCheckAt={lastCheckAt} isAdmin={isAdmin} />
      <MetricCards
        checksToday={checksToday.length}
        threatsToday={threatsToday}
        keywordCount={brand.keywords.length}
        last7DaysThreats={last7Days}
        monthlySpend={brand.monthlyBrandSpend}
        brandRoas={brand.brandRoas}
        isAdmin={isAdmin}
      />
      <DashboardTabs brandId={brandId} hasGoogleAds={!!brand.googleAdsCustomerId} />
      <ActivityFeed checks={checksWithAds} brandId={brandId} brandToken={brand.clientToken} />
    </div>
  )
}
