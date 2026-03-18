import { notFound } from 'next/navigation'
import { getBrandByToken, getRecentSerpChecks, getCompetitorAdsForChecks, getAuctionInsightsLast30Days } from '@/lib/db/queries'
import { CompetitorTimeline } from '@/components/competitor-timeline'
import { AuctionChart } from '@/components/auction-chart'
import { ThemeToggle } from '@/components/theme-toggle'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatGBP, formatRoas } from '@/lib/formatters'
import type { CompetitorAd } from '@/lib/db/schema'

export default async function ClientPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const brand = await getBrandByToken(token)
  if (!brand) notFound()

  const checks = await getRecentSerpChecks(brand.id, 100)
  const allAds = await getCompetitorAdsForChecks(checks.map(c => c.id))
  const adsByCheckId = allAds.reduce<Record<string, CompetitorAd[]>>((acc, ad) => {
    if (!acc[ad.serpCheckId]) acc[ad.serpCheckId] = []
    acc[ad.serpCheckId].push(ad)
    return acc
  }, {})
  const checksWithAds = checks.map(c => ({ ...c, ads: adsByCheckId[c.id] ?? [] }))
  const insights = await getAuctionInsightsLast30Days(brand.id)
  const lastCheck = checks[0]

  const todayStr = new Date().toDateString()
  const competitorsToday = new Set(
    checksWithAds.filter(c => new Date(c.checkedAt).toDateString() === todayStr).flatMap(c => c.ads.map(a => a.domain))
  ).size

  return (
    <div className="min-h-screen bg-background bg-dot-pattern">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gradient-tech">{brand.name} — Brand Monitor</h1>
            {lastCheck && (
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                Last checked: {new Date(lastCheck.checkedAt).toLocaleString('en-GB')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {competitorsToday === 0 ? (
              <Badge className="font-mono text-xs bg-transparent border border-green-500/40 text-tech-green">
                CLEAR
              </Badge>
            ) : (
              <Badge variant="destructive" className="font-mono text-xs">
                {competitorsToday} competitor{competitorsToday > 1 ? 's' : ''} today
              </Badge>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        {/* All-clear banner */}
        {competitorsToday === 0 && (
          <Alert className="border-green-500/20 bg-green-500/5">
            <AlertDescription className="text-tech-green font-mono text-xs tracking-wide">
              No competitors detected bidding on your brand keywords today.
            </AlertDescription>
          </Alert>
        )}

        {/* Metric Cards */}
        {(brand.monthlyBrandSpend || brand.brandRoas) && (
          <div className="grid grid-cols-2 gap-4">
            {brand.monthlyBrandSpend && (
              <div className="rounded-lg border border-border bg-card p-4 metric-stripe-blue tech-card-hover">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Monthly Brand Spend</p>
                <p className="font-mono text-2xl font-bold text-tech-blue">{formatGBP(brand.monthlyBrandSpend)}</p>
              </div>
            )}
            {brand.brandRoas && (
              <div className="rounded-lg border border-border bg-card p-4 metric-stripe-cyan tech-card-hover">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Brand ROAS</p>
                <p className="font-mono text-2xl font-bold text-tech-cyan">{formatRoas(brand.brandRoas)}</p>
              </div>
            )}
          </div>
        )}

        {/* Tabs: Timeline / Auction Insights */}
        <Tabs defaultValue="timeline">
          <TabsList variant="line" className="border-b border-border rounded-none w-full justify-start pb-0 mb-0 gap-4">
            <TabsTrigger
              value="timeline"
              className="pb-3"
            >
              SERP Timeline
            </TabsTrigger>
            <TabsTrigger
              value="auction"
              className="pb-3"
            >
              Auction Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            <div className="rounded-lg border border-border bg-card overflow-x-auto">
              <CompetitorTimeline checks={checksWithAds} />
            </div>
          </TabsContent>

          <TabsContent value="auction">
            <div className="rounded-lg border border-border bg-card metric-stripe-cyan p-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">30-Day Auction Insights</p>
              <AuctionChart insights={insights} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
