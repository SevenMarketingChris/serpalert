import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { getBrandById, getAuctionInsightsLast30Days } from '@/lib/db/queries'
import { checkIsAdmin, authorizeBrandAccess } from '@/lib/auth'
import { AuctionChart } from '@/components/auction-chart'

export default async function InsightsPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const isAdmin = await checkIsAdmin()

  const brand = await getBrandById(brandId)
  if (!brand) notFound()
  try {
    authorizeBrandAccess(brand, userId, isAdmin)
  } catch {
    notFound()
  }

  const hasGoogleAds = !!brand.googleAdsCustomerId

  return (
    <div className="max-w-5xl space-y-4">
      {hasGoogleAds ? (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground font-mono mb-4">
            Auction Insights — Last 30 Days
          </h2>
          <AuctionChartSection brandId={brandId} />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-6 text-center space-y-2">
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
    </div>
  )
}

async function AuctionChartSection({ brandId }: { brandId: string }) {
  const insights = await getAuctionInsightsLast30Days(brandId)
  return <AuctionChart insights={insights} />
}
