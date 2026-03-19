import { GoogleAdsApi } from 'google-ads-api'

export interface AuctionInsightRow {
  competitorDomain: string
  impressionShare: number | null
  overlapRate: number | null
  outrankingShare: number | null
}

interface GoogleAdsRow {
  auction_insight?: { domain?: string }
  metrics?: {
    auction_insight_search_impression_share?: number | null
    auction_insight_search_overlap_rate?: number | null
    auction_insight_search_outranking_share?: number | null
  }
}

export async function getAuctionInsights(customerId: string): Promise<AuctionInsightRow[]> {
  if (!process.env.GOOGLE_ADS_CLIENT_ID || !process.env.GOOGLE_ADS_CLIENT_SECRET || !process.env.GOOGLE_ADS_DEVELOPER_TOKEN || !process.env.GOOGLE_ADS_REFRESH_TOKEN) {
    throw new Error('Missing Google Ads credentials')
  }

  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  })
  const customer = client.Customer({
    customer_id: customerId.replace(/-/g, ''),
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
  })

  const rows = await Promise.race([
    customer.query(`
      SELECT
        auction_insight.domain,
        metrics.auction_insight_search_impression_share,
        metrics.auction_insight_search_overlap_rate,
        metrics.auction_insight_search_outranking_share
      FROM auction_insight
      WHERE segments.date DURING LAST_7_DAYS
    `),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Google Ads API timeout (30s)')), 30_000)),
  ])

  return (rows as GoogleAdsRow[]).map((row) => ({
    competitorDomain: row.auction_insight?.domain ?? '',
    impressionShare: row.metrics?.auction_insight_search_impression_share ?? null,
    overlapRate: row.metrics?.auction_insight_search_overlap_rate ?? null,
    outrankingShare: row.metrics?.auction_insight_search_outranking_share ?? null,
  }))
}
