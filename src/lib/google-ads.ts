import { GoogleAdsApi, enums } from 'google-ads-api'

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

  let timer: ReturnType<typeof setTimeout> | undefined
  const actualQuery = customer.query(`
    SELECT
      auction_insight.domain,
      metrics.auction_insight_search_impression_share,
      metrics.auction_insight_search_overlap_rate,
      metrics.auction_insight_search_outranking_share
    FROM auction_insight
    WHERE segments.date DURING LAST_7_DAYS
  `)
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Google Ads API timeout (30s)')), 30_000)
  })
  let rows: unknown[]
  try {
    rows = await Promise.race([actualQuery, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }

  return (rows as GoogleAdsRow[]).map((row) => ({
    competitorDomain: row.auction_insight?.domain ?? '',
    impressionShare: row.metrics?.auction_insight_search_impression_share ?? null,
    overlapRate: row.metrics?.auction_insight_search_overlap_rate ?? null,
    outrankingShare: row.metrics?.auction_insight_search_outranking_share ?? null,
  }))
}

/**
 * Enable or pause a Google Ads campaign.
 * Used to automatically toggle brand campaigns when competitors are detected.
 */
export async function setCampaignStatus(
  customerId: string,
  campaignId: string,
  enabled: boolean
): Promise<void> {
  if (!process.env.GOOGLE_ADS_CLIENT_ID || !process.env.GOOGLE_ADS_CLIENT_SECRET || !process.env.GOOGLE_ADS_DEVELOPER_TOKEN || !process.env.GOOGLE_ADS_REFRESH_TOKEN) {
    console.warn('Missing Google Ads credentials — skipping campaign toggle')
    return
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

  const status = enabled
    ? enums.CampaignStatus.ENABLED
    : enums.CampaignStatus.PAUSED
  const statusLabel = enabled ? 'ENABLED' : 'PAUSED'

  console.log(`Google Ads: setting campaign ${campaignId} to ${statusLabel} for customer ${customerId}`)

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Google Ads campaign toggle timeout (15s)')), 15_000)
  })

  try {
    await Promise.race([
      customer.campaigns.update([
        {
          resource_name: `customers/${customerId.replace(/-/g, '')}/campaigns/${campaignId}`,
          status,
        },
      ]),
      timeout,
    ])
    console.log(`Google Ads: campaign ${campaignId} set to ${statusLabel}`)
  } finally {
    if (timer) clearTimeout(timer)
  }
}
