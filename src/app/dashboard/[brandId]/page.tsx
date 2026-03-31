import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getBrandById, getRecentSerpChecks, getCompetitorAdsForChecks } from '@/lib/db/queries'
import { checkIsAdmin } from '@/lib/auth'
import { ManualCheckButton } from '@/components/manual-check-button'
import { ActivityFeed } from '@/components/activity-feed'
import { TrendChart } from '@/components/trend-chart'
import { RecentScan } from '@/components/recent-scan'
import { CompetitorTable } from '@/components/competitor-table'
import { SparklineBars } from '@/components/sparkline-bars'
import { toUTCDate, getRelativeTime } from '@/lib/time'
import { ShieldCheck, AlertTriangle } from 'lucide-react'
import { groupChecksIntoRuns } from '@/lib/group-checks'

export default async function BrandDashboard({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params

  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const isAdmin = await checkIsAdmin()

  const brand = await getBrandById(brandId)
  if (!brand) notFound()
  if (brand.agencyManaged && !isAdmin) notFound()
  if (!brand.agencyManaged && brand.userId !== userId) notFound()

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

  // Unique competitor domains last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const activeCompetitors = new Set(
    allAds.filter(a => {
      const check = checks.find(c => c.id === a.serpCheckId)
      return check && new Date(check.checkedAt) >= sevenDaysAgo
    }).map(a => a.domain)
  ).size

  // Build 7-day threat counts for sparkline
  const last7Days: number[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dayStr = toUTCDate(d)
    const dayChecks = checks.filter(c => toUTCDate(new Date(c.checkedAt)) === dayStr)
    const dayCheckIds = dayChecks.map(c => c.id)
    last7Days.push(new Set(allAds.filter(a => dayCheckIds.includes(a.serpCheckId)).map(a => a.domain)).size)
  }

  // Build 30-day activity data for trend chart
  const last30Days: { date: string; checks: number; threats: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dayStr = toUTCDate(d)
    const dayChecks = checks.filter(c => toUTCDate(new Date(c.checkedAt)) === dayStr)
    const dayCheckIds = dayChecks.map(c => c.id)
    const dayThreats = new Set(allAds.filter(a => dayCheckIds.includes(a.serpCheckId)).map(a => a.domain)).size
    last30Days.push({
      date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      checks: dayChecks.length,
      threats: dayThreats,
    })
  }

  const lastCheckAt = checks[0]?.checkedAt ? new Date(checks[0].checkedAt).toISOString() : null
  const relativeTime = lastCheckAt ? `Last check: ${getRelativeTime(lastCheckAt)}` : 'No checks yet'
  const isProtected = threatsToday === 0

  // Build checksWithAds for activity feed
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

  // Latest scan run
  const runs = groupChecksIntoRuns(checksWithAds)
  const latestRun = runs[0] ?? null

  // Competitor frequency table (top 5 by 30d)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const competitorFreq: Record<string, { count: number; keywords: Set<string>; lastSeen: Date }> = {}
  for (const ad of allAds) {
    const check = checks.find(c => c.id === ad.serpCheckId)
    if (!check) continue
    const checkDate = new Date(check.checkedAt)
    if (checkDate < thirtyDaysAgo) continue
    if (!competitorFreq[ad.domain]) {
      competitorFreq[ad.domain] = { count: 0, keywords: new Set(), lastSeen: checkDate }
    }
    competitorFreq[ad.domain].count++
    competitorFreq[ad.domain].keywords.add(check.keyword)
    if (checkDate > competitorFreq[ad.domain].lastSeen) {
      competitorFreq[ad.domain].lastSeen = checkDate
    }
  }
  const topCompetitors = Object.entries(competitorFreq)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([domain, data]) => ({
      domain,
      timesSeen: data.count,
      keywords: data.keywords.size,
      lastSeen: data.lastSeen.toISOString(),
    }))

  return (
    <div className="space-y-4 max-w-5xl">
      {/* (a) Status Banner */}
      <div className={`rounded-xl overflow-hidden ${
        isProtected
          ? 'bg-emerald-50 border border-emerald-200'
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
              isProtected ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
            }`}>
              {isProtected
                ? <ShieldCheck className="w-5 h-5" />
                : <AlertTriangle className="w-5 h-5" />
              }
            </div>
            <div>
              <p className={`text-lg font-bold ${isProtected ? 'text-emerald-700' : 'text-red-700'}`}>
                {isProtected
                  ? 'Brand Protected'
                  : `${threatsToday} Threat${threatsToday !== 1 ? 's' : ''} Detected`}
              </p>
              <p className="text-xs text-gray-500">
                {isProtected
                  ? 'No competitors detected today'
                  : `${threatsToday} competitor${threatsToday !== 1 ? 's' : ''} bidding on your brand`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-mono hidden sm:inline">{relativeTime}</span>
            <ManualCheckButton brandId={brandId} />
          </div>
        </div>
      </div>

      {/* (b) Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-mono">Checks Today</p>
          <p className="text-2xl font-bold font-mono text-gray-900 mt-1">{checksToday.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-mono">Active Competitors</p>
          <p className="text-2xl font-bold font-mono text-gray-900 mt-1">{activeCompetitors}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-mono">Keywords</p>
          <p className="text-2xl font-bold font-mono text-gray-900 mt-1">{brand.keywords.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-mono">7d Trend</p>
          <div className="mt-2">
            <SparklineBars data={last7Days} />
          </div>
        </div>
      </div>

      {/* (c) Recent Scan */}
      {latestRun && (
        <RecentScan run={latestRun} />
      )}

      {/* (d) Activity Feed */}
      <ActivityFeed checks={checksWithAds} brandId={brandId} brandToken={brand.clientToken} />

      {/* (e) 30-Day Trend Chart */}
      <TrendChart data={last30Days} />

      {/* (f) Competitor Summary Table */}
      {topCompetitors.length > 0 && (
        <CompetitorTable competitors={topCompetitors} brandId={brandId} />
      )}
    </div>
  )
}
