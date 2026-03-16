import { notFound } from 'next/navigation'
import { getBrandByToken, getRecentSerpChecks, getCompetitorAdsForCheck, getAuctionInsightsLast30Days } from '@/lib/db/queries'
import { CompetitorTimeline } from '@/components/competitor-timeline'
import { AuctionChart } from '@/components/auction-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function ClientPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const brand = await getBrandByToken(token)
  if (!brand) notFound()

  const checks = await getRecentSerpChecks(brand.id, 100)
  const checksWithAds = await Promise.all(checks.map(async c => ({ ...c, ads: await getCompetitorAdsForCheck(c.id) })))
  const insights = await getAuctionInsightsLast30Days(brand.id)
  const lastCheck = checks[0]

  const todayStr = new Date().toDateString()
  const competitorsToday = new Set(
    checksWithAds.filter(c => new Date(c.checkedAt).toDateString() === todayStr).flatMap(c => c.ads.map(a => a.domain))
  ).size

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">{brand.name} — Brand Monitor</h1>
        <Badge variant={competitorsToday > 0 ? 'destructive' : 'outline'} className={competitorsToday === 0 ? 'text-green-600 border-green-300' : ''}>
          {competitorsToday > 0 ? `${competitorsToday} competitor${competitorsToday > 1 ? 's' : ''} today` : 'No competitors today'}
        </Badge>
      </div>
      {lastCheck && <p className="text-xs text-muted-foreground mb-6">Last checked: {new Date(lastCheck.checkedAt).toLocaleString('en-GB')}</p>}
      {competitorsToday === 0 && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <p className="text-sm text-green-800">✅ No competitors detected bidding on your brand today.</p>
          </CardContent>
        </Card>
      )}
      <Card className="mb-8"><CardHeader><CardTitle>Auction Insights — 30 days</CardTitle></CardHeader><CardContent><AuctionChart insights={insights} /></CardContent></Card>
      <Card><CardHeader><CardTitle>SERP History</CardTitle></CardHeader><CardContent className="overflow-x-auto"><CompetitorTimeline checks={checksWithAds} /></CardContent></Card>
    </div>
  )
}
