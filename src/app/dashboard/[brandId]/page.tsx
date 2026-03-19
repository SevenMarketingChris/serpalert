import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getBrandById, getRecentSerpChecks, getCompetitorAdsForChecks, getAuctionInsightsLast30Days } from '@/lib/db/queries'
import { auth } from '../../../../auth'
import { isAdminEmail } from '@/lib/auth'
import { CompetitorTimeline } from '@/components/competitor-timeline'
import { AuctionChart } from '@/components/auction-chart'
import { ThemeToggle } from '@/components/theme-toggle'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { CompetitorAd } from '@/lib/db/schema'

export default async function DashboardPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params
  const session = await auth()
  if (!session) redirect('/login')

  const userEmail = session.user?.email ?? ''
  const isAdmin = isAdminEmail(userEmail)

  const brand = await getBrandById(brandId)
  if (!brand) notFound()

  // Allow if admin OR if they own this brand
  if (!isAdmin && brand.userId !== userEmail) redirect('/unauthorized')

  const checks = await getRecentSerpChecks(brandId, 100)
  const allAds = await getCompetitorAdsForChecks(checks.map(c => c.id))
  const adsByCheckId = allAds.reduce<Record<string, CompetitorAd[]>>((acc, ad) => {
    if (!acc[ad.serpCheckId]) acc[ad.serpCheckId] = []
    acc[ad.serpCheckId].push(ad)
    return acc
  }, {})
  const checksWithAds = checks.map(c => ({ ...c, ads: adsByCheckId[c.id] ?? [] }))
  const insights = isAdmin && brand.googleAdsCustomerId ? await getAuctionInsightsLast30Days(brandId) : []

  const todayStr = new Date().toDateString()
  const todayChecks = checksWithAds.filter(c => new Date(c.checkedAt).toDateString() === todayStr)
  const competitorsToday = new Set(todayChecks.flatMap(c => c.ads.map(a => a.domain))).size
  const allDomains = new Set(checksWithAds.flatMap(c => c.ads.map(a => a.domain))).size

  const backUrl = isAdmin ? '/admin' : '/dashboard'

  return (
    <div className="min-h-screen bg-background bg-dot-pattern">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="container mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={backUrl}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </Link>
            <span className="text-border">|</span>
            <div>
              <h1 className="text-2xl font-bold text-gradient-tech">{brand.name}</h1>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-0.5">Brand Monitor</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-6xl space-y-6">
        {/* Metric Cards */}
        <div className={`grid gap-4 ${isAdmin ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {/* Monthly Spend — admin only */}
          {isAdmin && brand.monthlyBrandSpend && (
            <div className="rounded-lg border border-border bg-card p-4 metric-stripe-blue tech-card-hover">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Monthly Spend</p>
              <p className="font-mono text-2xl font-bold text-tech-blue">{`£${parseFloat(brand.monthlyBrandSpend).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}</p>
            </div>
          )}

          {/* Brand ROAS — admin only */}
          {isAdmin && brand.brandRoas && (
            <div className="rounded-lg border border-border bg-card p-4 metric-stripe-cyan tech-card-hover">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Brand ROAS</p>
              <p className="font-mono text-2xl font-bold text-tech-cyan">{parseFloat(brand.brandRoas).toFixed(1)}x</p>
            </div>
          )}

          {/* Checks Today */}
          <div className="rounded-lg border border-border bg-card p-4 metric-stripe-purple tech-card-hover">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Checks Today</p>
            <p className="font-mono text-2xl font-bold text-tech-purple">{todayChecks.length}</p>
          </div>

          {/* Competitors Today */}
          <div className={`rounded-lg border border-border bg-card p-4 tech-card-hover ${competitorsToday === 0 ? 'metric-stripe-green' : 'metric-stripe-blue'}`}>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Competitors Today</p>
            <p className={`font-mono text-2xl font-bold ${competitorsToday === 0 ? 'text-tech-green' : 'text-tech-blue'}`}>
              {competitorsToday}
            </p>
          </div>

          {/* Total Keywords */}
          <div className="rounded-lg border border-border bg-card p-4 metric-stripe-orange tech-card-hover">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Keywords</p>
            <p className="font-mono text-2xl font-bold text-tech-orange">{brand.keywords.length}</p>
          </div>
        </div>

        {/* Unique competitors (all time) */}
        {allDomains > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span className="text-tech-cyan">{allDomains}</span>
            <span>unique competitor domains detected across all time</span>
          </div>
        )}

        {/* Tabs: Timeline / Auction Insights */}
        <Tabs defaultValue="timeline">
          <TabsList variant="line" className="border-b border-border rounded-none w-full justify-start pb-0 mb-0 gap-4">
            <TabsTrigger value="timeline" className="pb-3">
              SERP Timeline
            </TabsTrigger>
            {isAdmin && brand.googleAdsCustomerId && (
              <TabsTrigger value="auction" className="pb-3">
                Auction Insights
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="timeline">
            <div className="rounded-lg border border-border bg-card overflow-x-auto">
              <CompetitorTimeline checks={checksWithAds} />
            </div>
          </TabsContent>

          {isAdmin && brand.googleAdsCustomerId && (
            <TabsContent value="auction">
              <div className="rounded-lg border border-border bg-card metric-stripe-cyan p-6">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">30-Day Auction Insights</p>
                <AuctionChart insights={insights} />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
