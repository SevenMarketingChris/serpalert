import { getSupabase } from './index'
import type { Brand, SerpCheck, CompetitorAd, AuctionInsight } from './schema'

// Column name mapping helpers (DB snake_case → TS camelCase)
function mapBrand(r: Record<string, unknown>): Brand {
  return {
    id: r.id as string,
    name: r.name as string,
    slug: r.slug as string,
    clientToken: r.client_token as string,
    googleAdsCustomerId: (r.google_ads_customer_id as string) ?? null,
    keywords: r.keywords as string[],
    active: r.active as boolean,
    slackWebhookUrl: (r.slack_webhook_url as string) ?? null,
    createdAt: new Date(r.created_at as string),
  }
}

function mapSerpCheck(r: Record<string, unknown>): SerpCheck {
  return {
    id: r.id as string,
    brandId: r.brand_id as string,
    keyword: r.keyword as string,
    checkedAt: new Date(r.checked_at as string),
    device: r.device as string,
    location: r.location as string,
    competitorCount: r.competitor_count as number,
    screenshotUrl: (r.screenshot_url as string) ?? null,
  }
}

function mapCompetitorAd(r: Record<string, unknown>): CompetitorAd {
  return {
    id: r.id as string,
    serpCheckId: r.serp_check_id as string,
    brandId: r.brand_id as string,
    domain: r.domain as string,
    headline: (r.headline as string) ?? null,
    description: (r.description as string) ?? null,
    displayUrl: (r.display_url as string) ?? null,
    destinationUrl: (r.destination_url as string) ?? null,
    position: (r.position as number) ?? null,
    firstSeenAt: new Date(r.first_seen_at as string),
  }
}

function mapAuctionInsight(r: Record<string, unknown>): AuctionInsight {
  return {
    id: r.id as string,
    brandId: r.brand_id as string,
    date: r.date as string,
    competitorDomain: r.competitor_domain as string,
    impressionShare: (r.impression_share as string) ?? null,
    overlapRate: (r.overlap_rate as string) ?? null,
    outrankingShare: (r.outranking_share as string) ?? null,
  }
}

export async function getBrandById(id: string): Promise<Brand | null> {
  const { data } = await getSupabase().from('brands').select('*').eq('id', id).single()
  return data ? mapBrand(data) : null
}

export async function getBrandByToken(token: string): Promise<Brand | null> {
  const { data } = await getSupabase().from('brands').select('*').eq('client_token', token).single()
  return data ? mapBrand(data) : null
}

export async function getAllActiveBrands(): Promise<Brand[]> {
  const { data } = await getSupabase().from('brands').select('*').eq('active', true)
  return (data ?? []).map(mapBrand)
}

export async function getRecentSerpChecks(brandId: string, limit = 50): Promise<SerpCheck[]> {
  const { data } = await getSupabase()
    .from('serp_checks').select('*')
    .eq('brand_id', brandId)
    .order('checked_at', { ascending: false })
    .limit(limit)
  return (data ?? []).map(mapSerpCheck)
}

export async function getCompetitorAdsForCheck(serpCheckId: string): Promise<CompetitorAd[]> {
  const { data } = await getSupabase().from('competitor_ads').select('*').eq('serp_check_id', serpCheckId)
  return (data ?? []).map(mapCompetitorAd)
}

export async function getCompetitorDomainsLastNDays(brandId: string, days: number): Promise<string[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const { data } = await getSupabase()
    .from('competitor_ads').select('domain')
    .eq('brand_id', brandId)
    .gte('first_seen_at', since.toISOString())
  const unique = [...new Set((data ?? []).map(r => r.domain as string))]
  return unique
}

export async function getAuctionInsightsLast30Days(brandId: string): Promise<AuctionInsight[]> {
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const { data } = await getSupabase()
    .from('auction_insights').select('*')
    .eq('brand_id', brandId)
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: false })
  return (data ?? []).map(mapAuctionInsight)
}

export async function insertSerpCheck(data: {
  brandId: string; keyword: string; competitorCount: number; screenshotUrl?: string
}): Promise<SerpCheck> {
  const { data: rows, error } = await getSupabase()
    .from('serp_checks')
    .insert({ brand_id: data.brandId, keyword: data.keyword, competitor_count: data.competitorCount, screenshot_url: data.screenshotUrl })
    .select()
  if (error) throw new Error(error.message)
  if (!rows?.[0]) throw new Error('Failed to insert serp check')
  return mapSerpCheck(rows[0])
}

export async function insertCompetitorAds(ads: {
  serpCheckId: string; brandId: string; domain: string; headline?: string
  description?: string; displayUrl?: string; destinationUrl?: string
  position?: number; firstSeenAt: Date
}[]): Promise<void> {
  if (ads.length === 0) return
  const { error } = await getSupabase().from('competitor_ads').insert(
    ads.map(a => ({
      serp_check_id: a.serpCheckId,
      brand_id: a.brandId,
      domain: a.domain,
      headline: a.headline,
      description: a.description,
      display_url: a.displayUrl,
      destination_url: a.destinationUrl,
      position: a.position,
      first_seen_at: a.firstSeenAt.toISOString(),
    }))
  )
  if (error) throw new Error(error.message)
}

export async function insertAuctionInsights(insights: {
  brandId: string; date: string; competitorDomain: string
  impressionShare?: string; overlapRate?: string; outrankingShare?: string
}[]): Promise<void> {
  if (insights.length === 0) return
  const { error } = await getSupabase().from('auction_insights').insert(
    insights.map(i => ({
      brand_id: i.brandId,
      date: i.date,
      competitor_domain: i.competitorDomain,
      impression_share: i.impressionShare,
      overlap_rate: i.overlapRate,
      outranking_share: i.outrankingShare,
    }))
  )
  if (error) throw new Error(error.message)
}

export async function createBrand(data: {
  name: string; slug: string; keywords: string[]
  googleAdsCustomerId?: string; slackWebhookUrl?: string
}): Promise<Brand> {
  const { data: rows, error } = await getSupabase()
    .from('brands')
    .insert({ name: data.name, slug: data.slug, keywords: data.keywords, google_ads_customer_id: data.googleAdsCustomerId, slack_webhook_url: data.slackWebhookUrl })
    .select()
  if (error) throw new Error(error.message)
  if (!rows?.[0]) throw new Error('Failed to create brand')
  return mapBrand(rows[0])
}
