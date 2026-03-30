import { notFound } from 'next/navigation'
import { getBrandById, getRecentSerpChecks, getCompetitorAdsForChecks } from '@/lib/db/queries'
import { StatusHero } from '@/components/status-hero'
import { GoogleAdsStatus } from '@/components/google-ads-status'
import { BudgetRedirectSummary } from '@/components/budget-redirect-summary'
import { DashboardTabs } from '@/components/dashboard-tabs'
import { ActivityFeed } from '@/components/activity-feed'
import { TrendChart } from '@/components/trend-chart'
import { toUTCDate } from '@/lib/time'

export default async function BrandDashboard({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params

  const brand = await getBrandById(brandId)
  if (!brand) notFound()

  const isAdmin = true

  const checks = await getRecentSerpChecks(brandId, 100)
  const todayStr = toUTCDate(new Date())
  const checksToday = checks.filter(c => toUTCDate(new Date(c.checkedAt)) === todayStr)
  const allAds = await getCompetitorAdsForChecks(checks.map(c => c.id))
  const threatsToday = new Set(
    allAds.filter(a => {
      const check = checks.find(c => c.id === a.serpCheckId)
      return check && toUTCDate(new Date(check.checkedAt)) === todayStr
    }).map(a => a.domain)
  ).size

  // Build 7-day threat counts
  const last7Days: number[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dayStr = toUTCDate(d)
    const dayChecks = checks.filter(c => toUTCDate(new Date(c.checkedAt)) === dayStr)
    const dayCheckIds = dayChecks.map(c => c.id)
    last7Days.push(allAds.filter(a => dayCheckIds.includes(a.serpCheckId)).length)
  }

  // Build 30-day activity data for trend chart
  const last30Days: { date: string; checks: number; threats: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dayStr = toUTCDate(d)
    const dayChecks = checks.filter(c => toUTCDate(new Date(c.checkedAt)) === dayStr)
    const dayCheckIds = dayChecks.map(c => c.id)
    const dayThreats = allAds.filter(a => dayCheckIds.includes(a.serpCheckId)).length
    last30Days.push({
      date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      checks: dayChecks.length,
      threats: dayThreats,
    })
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
      destinationUrl: a.destinationUrl,
      position: a.position,
      status: a.status,
    })),
  }))

  return (
    <div className="space-y-4 max-w-5xl">
      <StatusHero
        brandId={brandId}
        threatsToday={threatsToday}
        lastCheckAt={lastCheckAt}
        isAdmin={isAdmin}
        checksToday={checksToday.length}
        keywordCount={brand.keywords.length}
        last7DaysThreats={last7Days}
      />
      <GoogleAdsStatus
        googleAdsCustomerId={brand.googleAdsCustomerId}
        brandCampaignId={brand.brandCampaignId}
        hasCompetitors={threatsToday > 0}
      />
      <BudgetRedirectSummary
        monthlyBrandSpend={brand.monthlyBrandSpend ?? null}
        brandRoas={brand.brandRoas ?? null}
        competitorCount={threatsToday}
      />
      <DashboardTabs brandId={brandId} hasGoogleAds={!!brand.googleAdsCustomerId} />
      <TrendChart data={last30Days} />
      <ActivityFeed checks={checksWithAds} brandId={brandId} brandToken={brand.clientToken} />
    </div>
  )
}
