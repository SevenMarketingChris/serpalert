import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getBrandById, getAuctionInsightsLast30Days } from '@/lib/db/queries'
import { auth } from '../../../../../auth'
import { DashboardTabs } from '@/components/dashboard-tabs'
import { AuctionChart } from '@/components/auction-chart'

export default async function InsightsPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params
  const session = await auth()
  if (!session) redirect('/login')

  const brand = await getBrandById(brandId)
  if (!brand) notFound()

  const hasGoogleAds = !!brand.googleAdsCustomerId

  return (
    <div className="max-w-5xl space-y-4">
      <DashboardTabs brandId={brandId} hasGoogleAds={hasGoogleAds} />

      {hasGoogleAds ? (
        <div className="bg-card border border-edge rounded-lg p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground font-mono mb-4">
            Auction Insights — Last 30 Days
          </h2>
          <AuctionChartSection brandId={brandId} />
        </div>
      ) : (
        <div className="bg-card border border-edge rounded-lg p-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Connect Google Ads to see auction insights. Add your Customer ID in Settings.
          </p>
          <Link
            href={`/dashboard/${brandId}/settings`}
            className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Go to Settings
          </Link>
        </div>
      )}

      {/* Future sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-edge rounded-lg p-6">
          <p className="text-muted-foreground text-sm">SEO Metrics — Coming soon</p>
        </div>
        <div className="bg-card border border-edge rounded-lg p-6">
          <p className="text-muted-foreground text-sm">Monthly Reports — Coming soon</p>
        </div>
      </div>
    </div>
  )
}

async function AuctionChartSection({ brandId }: { brandId: string }) {
  const insights = await getAuctionInsightsLast30Days(brandId)
  return <AuctionChart insights={insights} />
}
