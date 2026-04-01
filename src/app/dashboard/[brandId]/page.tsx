import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getBrandById, getRecentSerpChecks, getCompetitorAdsForChecks } from '@/lib/db/queries'
import { checkIsAdmin, authorizeBrandAccess } from '@/lib/auth'
import { ManualCheckButton } from '@/components/manual-check-button'
import { ActivityFeed } from '@/components/activity-feed'
import { TrendChart } from '@/components/trend-chart'
import { RecentScan } from '@/components/recent-scan'
import { CompetitorSummary } from '@/components/competitor-summary'
import { SparklineBars } from '@/components/sparkline-bars'
import { DashboardCalculator } from '@/components/dashboard-calculator'
import { UpgradeBanner } from '@/components/upgrade-banner'
import { toUTCDate, getRelativeTime } from '@/lib/time'
import { ShieldCheck, AlertTriangle, Sparkles } from 'lucide-react'
import { groupChecksIntoRuns } from '@/lib/group-checks'

export default async function BrandDashboard({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params

  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const [isAdmin, brand] = await Promise.all([
    checkIsAdmin(),
    getBrandById(brandId),
  ])
  if (!brand) notFound()
  try {
    authorizeBrandAccess(brand, userId, isAdmin)
  } catch {
    notFound()
  }

  const checks = await getRecentSerpChecks(brandId, 100)
  const todayStr = toUTCDate(new Date())
  const checksToday = checks.filter(c => toUTCDate(new Date(c.checkedAt)) === todayStr)
  const allAds = await getCompetitorAdsForChecks(checks.map(c => c.id))

  // O(1) lookups: check by id, ads by check id
  const checkById = new Map(checks.map(c => [c.id, c]))
  const adsByCheckId = new Map<string, typeof allAds>()
  for (const ad of allAds) {
    const existing = adsByCheckId.get(ad.serpCheckId) || []
    existing.push(ad)
    adsByCheckId.set(ad.serpCheckId, existing)
  }

  const threatsToday = new Set(
    allAds.filter(a => {
      const check = checkById.get(a.serpCheckId)
      return check && toUTCDate(new Date(check.checkedAt)) === todayStr
    }).map(a => a.domain)
  ).size

  // Unique competitor domains last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const activeCompetitors = new Set(
    allAds.filter(a => {
      const check = checkById.get(a.serpCheckId)
      return check && new Date(check.checkedAt) >= sevenDaysAgo
    }).map(a => a.domain)
  ).size

  // AI recommendation — only show after enough data (at least 4 checks)
  let aiRecommendation: string | null = null
  if (checks.length >= 4) {
    try {
      const { generateActionRecommendation } = await import('@/lib/ai')
      aiRecommendation = await generateActionRecommendation(
        brand.name,
        activeCompetitors,
        !!brand.googleAdsCustomerId,
        !!brand.brandCampaignId,
      )
    } catch {
      // AI unavailable — skip recommendation
    }
  }

  // Pre-group checks by date string for O(1) day lookups
  const checksByDate = new Map<string, typeof checks>()
  for (const c of checks) {
    const dateStr = toUTCDate(new Date(c.checkedAt))
    const existing = checksByDate.get(dateStr) || []
    existing.push(c)
    checksByDate.set(dateStr, existing)
  }

  // Build 7-day threat counts for sparkline
  const last7Days: number[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dayStr = toUTCDate(d)
    const dayChecks = checksByDate.get(dayStr) || []
    const dayDomains = new Set<string>()
    for (const c of dayChecks) {
      for (const ad of adsByCheckId.get(c.id) || []) {
        dayDomains.add(ad.domain)
      }
    }
    last7Days.push(dayDomains.size)
  }

  // Build 30-day activity data for trend chart
  const last30Days: { date: string; checks: number; threats: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dayStr = toUTCDate(d)
    const dayChecks = checksByDate.get(dayStr) || []
    const dayDomains30 = new Set<string>()
    for (const c of dayChecks) {
      for (const ad of adsByCheckId.get(c.id) || []) {
        dayDomains30.add(ad.domain)
      }
    }
    const dayThreats = dayDomains30.size
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
    ads: (adsByCheckId.get(c.id) || []).map(a => ({
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
    const check = checkById.get(ad.serpCheckId)
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

  const isTrialing = brand.subscriptionStatus === 'trialing'
  const isExpired = isTrialing && brand.trialEndsAt && new Date(brand.trialEndsAt) <= new Date()
  const isCanceled = brand.subscriptionStatus === 'canceled'
  const needsUpgrade = isTrialing || isExpired || isCanceled
  const trialDaysLeft = brand.trialEndsAt && isTrialing && !isExpired
    ? Math.max(0, Math.ceil((new Date(brand.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <div className="space-y-4 max-w-5xl">
      <h1 className="text-lg font-semibold text-gray-900">{brand.name}</h1>

      {/* Upgrade Banner — visible during trial/expired/canceled */}
      {needsUpgrade && !brand.agencyManaged && (
        <UpgradeBanner
          brandId={brand.id}
          isExpired={!!isExpired}
          isCanceled={!!isCanceled}
          daysLeft={trialDaysLeft}
        />
      )}

      {/* (a) Status Banner */}
      <div className={`rounded-2xl overflow-hidden ${
        isProtected
          ? 'bg-emerald-50/70 backdrop-blur-lg border border-emerald-200/50 shadow-lg shadow-emerald-100/20'
          : 'bg-red-50/70 backdrop-blur-lg border border-red-200/50 shadow-lg shadow-red-100/20'
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
            <ManualCheckButton brandId={brandId} lastCheckAt={checks[0]?.checkedAt ? new Date(checks[0].checkedAt).toISOString() : null} />
          </div>
        </div>
      </div>

      {/* (b) Metric Cards — clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href={`/dashboard/${brandId}/screenshots`} className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-4 shadow-lg shadow-gray-200/20 hover:shadow-md hover:border-indigo-200 transition-all group">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-mono group-hover:text-indigo-500 transition-colors">Checks Today</p>
          <p className="text-2xl font-bold font-mono text-gray-900 mt-1">{checksToday.length}</p>
        </Link>
        <Link href={`/dashboard/${brandId}/competitors`} className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-4 shadow-lg shadow-gray-200/20 hover:shadow-md hover:border-indigo-200 transition-all group">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-mono group-hover:text-indigo-500 transition-colors">Active Competitors</p>
          <p className="text-2xl font-bold font-mono text-gray-900 mt-1">{activeCompetitors}</p>
        </Link>
        <Link href={`/dashboard/${brandId}/settings`} className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-4 shadow-lg shadow-gray-200/20 hover:shadow-md hover:border-indigo-200 transition-all group">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-mono group-hover:text-indigo-500 transition-colors">Keywords</p>
          <p className="text-2xl font-bold font-mono text-gray-900 mt-1">{brand.keywords.length}</p>
        </Link>
        <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-4 shadow-lg shadow-gray-200/20">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-mono">7d Trend</p>
          <div className="mt-2">
            <SparklineBars data={last7Days} />
          </div>
        </div>
      </div>

      {/* AI Recommendation */}
      {aiRecommendation && (
        <div className="bg-indigo-50/60 backdrop-blur-lg border border-indigo-200/40 rounded-2xl p-4 shadow-lg shadow-indigo-100/10 flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <Sparkles className="h-4 w-4 text-indigo-500" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono mb-1">AI Recommendation</p>
            <p className="text-sm text-indigo-700">{aiRecommendation}</p>
          </div>
        </div>
      )}

      {/* Getting Started card for new brands */}
      {checks.length === 0 && (
        <div className="bg-indigo-50/60 backdrop-blur-lg border border-indigo-200/40 rounded-2xl p-5 shadow-lg shadow-indigo-100/10 space-y-3">
          <h3 className="font-semibold text-indigo-900">Getting started</h3>
          <p className="text-sm text-indigo-700">Your brand has been created and is queued for monitoring. Here&apos;s what happens next:</p>
          <ol className="list-decimal list-inside text-sm text-indigo-600 space-y-1.5">
            <li>Your first SERP check will run within the hour automatically</li>
            <li>We&apos;ll capture a screenshot of the Google results page for each keyword</li>
            <li>If any competitors are bidding on your brand, you&apos;ll see them here</li>
            <li>Set up <a href={`/dashboard/${brandId}/settings`} className="underline font-medium">Slack alerts</a> to get notified instantly</li>
          </ol>
        </div>
      )}

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
        <CompetitorSummary competitors={topCompetitors} brandId={brandId} />
      )}

      {/* (g) Budget Redirect Calculator */}
      <DashboardCalculator
        initialBrandSpend={brand.monthlyBrandSpend ? Number(brand.monthlyBrandSpend) : undefined}
        initialBrandRoas={brand.brandRoas ? Number(brand.brandRoas) : undefined}
      />
    </div>
  )
}
