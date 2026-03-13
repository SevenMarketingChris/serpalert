import { notFound } from 'next/navigation'
import { getBrandById, getRecentSerpChecks, getCompetitorAdsForCheck, getAuctionInsightsLast30Days } from '@/lib/db/queries'
import { CompetitorTimeline } from '@/components/competitor-timeline'
import { AuctionChart } from '@/components/auction-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params

  const brand = await getBrandById(brandId)
  if (!brand) notFound()

  const checks = await getRecentSerpChecks(brandId, 100)
  const checksWithAds = await Promise.all(checks.map(async c => ({ ...c, ads: await getCompetitorAdsForCheck(c.id) })))
  const insights = await getAuctionInsightsLast30Days(brandId)

  const todayStr = new Date().toDateString()
  const todayChecks = checksWithAds.filter(c => new Date(c.checkedAt).toDateString() === todayStr)
  const competitorsToday = new Set(todayChecks.flatMap(c => c.ads.map(a => a.domain))).size
  const allDomains = new Set(checksWithAds.flatMap(c => c.ads.map(a => a.domain))).size

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">{brand.name}</h1>
          <p className="text-sm text-muted-foreground">Serp Alert — Brand Dashboard</p>
        </div>
        <a href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← All brands</a>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Checks today</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{todayChecks.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Competitors today</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-red-500">{competitorsToday}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unique (all time)</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{allDomains}</p></CardContent></Card>
      </div>
      <Card className="mb-8"><CardHeader><CardTitle>Auction Insights — 30 days</CardTitle></CardHeader><CardContent><AuctionChart insights={insights} /></CardContent></Card>
      <Card><CardHeader><CardTitle>SERP History</CardTitle></CardHeader><CardContent className="overflow-x-auto"><CompetitorTimeline checks={checksWithAds} /></CardContent></Card>
    </div>
  )
}
