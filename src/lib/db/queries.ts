import { getSupabase } from './index'
import type { Brand, SerpCheck, CompetitorAd, AuctionInsight, PauseTest } from './schema'

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
    websiteUrl: (r.website_url as string) ?? null,
    monthlyBrandSpend: r.monthly_brand_spend != null ? String(r.monthly_brand_spend) : null,
    brandRoas: r.brand_roas != null ? String(r.brand_roas) : null,
    logoUrl: (r.logo_url as string) ?? null,
    description: (r.description as string) ?? null,
    phone: (r.phone as string) ?? null,
    agencyName: (r.agency_name as string) ?? null,
    agencyLogoUrl: (r.agency_logo_url as string) ?? null,
    agencyPrimaryColor: (r.agency_primary_color as string) ?? null,
    reportEmail: (r.report_email as string) ?? null,
    avgBrandCpc: r.avg_brand_cpc != null ? String(r.avg_brand_cpc) : null,
    monthlyBrandSearches: r.monthly_brand_searches != null ? Number(r.monthly_brand_searches) : null,
    createdAt: new Date(r.created_at as string),
  }
}

function mapPauseTest(r: Record<string, unknown>): PauseTest {
  return {
    id: r.id as string,
    brandId: r.brand_id as string,
    startedAt: new Date(r.started_at as string),
    endedAt: r.ended_at ? new Date(r.ended_at as string) : null,
    baselineExposureRate: r.baseline_exposure_rate != null ? String(r.baseline_exposure_rate) : null,
    duringExposureRate: r.during_exposure_rate != null ? String(r.during_exposure_rate) : null,
    notes: (r.notes as string) ?? null,
  }
}

function mapSerpCheck(r: Record<string, unknown>): SerpCheck {
  return {
    id: r.id as string,
    brandId: r.brand_id as string,
    scanGroupId: (r.scan_group_id as string) ?? null,
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
    landingPageScreenshotUrl: (r.landing_page_screenshot_url as string) ?? null,
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
  brandId: string; keyword: string; competitorCount: number; screenshotUrl?: string; scanGroupId?: string
}): Promise<SerpCheck> {
  const { data: rows, error } = await getSupabase()
    .from('serp_checks')
    .insert({ brand_id: data.brandId, keyword: data.keyword, competitor_count: data.competitorCount, screenshot_url: data.screenshotUrl, scan_group_id: data.scanGroupId })
    .select()
  if (error) throw new Error(error.message)
  if (!rows?.[0]) throw new Error('Failed to insert serp check')
  return mapSerpCheck(rows[0])
}

export async function insertCompetitorAds(ads: {
  serpCheckId: string; brandId: string; domain: string; headline?: string
  description?: string; displayUrl?: string; destinationUrl?: string
  position?: number; landingPageScreenshotUrl?: string; firstSeenAt: Date
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
      landing_page_screenshot_url: a.landingPageScreenshotUrl,
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
  googleAdsCustomerId?: string; slackWebhookUrl?: string; websiteUrl?: string
}): Promise<Brand> {
  const { data: rows, error } = await getSupabase()
    .from('brands')
    .insert({ name: data.name, slug: data.slug, keywords: data.keywords, google_ads_customer_id: data.googleAdsCustomerId, slack_webhook_url: data.slackWebhookUrl, website_url: data.websiteUrl })
    .select()
  if (error) throw new Error(error.message)
  if (!rows?.[0]) throw new Error('Failed to create brand')
  return mapBrand(rows[0])
}

export async function getAllBrands(): Promise<Brand[]> {
  const { data } = await getSupabase().from('brands').select('*').order('created_at', { ascending: false })
  return (data ?? []).map(mapBrand)
}

export async function updateBrandActive(id: string, active: boolean): Promise<void> {
  const { error } = await getSupabase().from('brands').update({ active }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateBrandMeta(id: string, meta: { logoUrl?: string | null; description?: string | null; phone?: string | null }): Promise<void> {
  const patch: Record<string, string | null> = {}
  if ('logoUrl' in meta) patch.logo_url = meta.logoUrl ?? null
  if ('description' in meta) patch.description = meta.description ?? null
  if ('phone' in meta) patch.phone = meta.phone ?? null
  const { error } = await getSupabase().from('brands').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateBrandRoas(id: string, monthlyBrandSpend: number | null, brandRoas: number | null): Promise<void> {
  const { error } = await getSupabase().from('brands').update({
    monthly_brand_spend: monthlyBrandSpend,
    brand_roas: brandRoas,
  }).eq('id', id)
  if (error) throw new Error(error.message)
}

export type CompetitorProfile = {
  domain: string
  firstSeen: Date
  lastSeen: Date
  totalAppearances: number
  recentAppearances: number   // last 7 days
  priorAppearances: number    // 8–14 days ago (for escalation comparison)
  uniqueKeywords: string[]
}

export async function getCompetitorProfiles(brandId: string): Promise<CompetitorProfile[]> {
  const { data } = await getSupabase()
    .from('competitor_ads')
    .select('domain, first_seen_at, serp_check_id, serp_checks!inner(keyword)')
    .eq('brand_id', brandId)
    .order('first_seen_at', { ascending: false })
  if (!data) return []

  const now = new Date()
  const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 7)
  const fourteenDaysAgo = new Date(now); fourteenDaysAgo.setDate(now.getDate() - 14)

  const map = new Map<string, {
    firstSeen: Date; lastSeen: Date; count: number
    recent: number; prior: number; keywords: Set<string>
  }>()

  for (const r of data) {
    const domain = r.domain as string
    const seenAt = new Date(r.first_seen_at as string)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const keyword = (r as any).serp_checks?.keyword as string
    if (!map.has(domain)) {
      map.set(domain, { firstSeen: seenAt, lastSeen: seenAt, count: 0, recent: 0, prior: 0, keywords: new Set() })
    }
    const entry = map.get(domain)!
    entry.count++
    if (seenAt < entry.firstSeen) entry.firstSeen = seenAt
    if (seenAt > entry.lastSeen) entry.lastSeen = seenAt
    if (keyword) entry.keywords.add(keyword)
    if (seenAt >= sevenDaysAgo) entry.recent++
    else if (seenAt >= fourteenDaysAgo) entry.prior++
  }

  return [...map.entries()].map(([domain, e]) => ({
    domain,
    firstSeen: e.firstSeen,
    lastSeen: e.lastSeen,
    totalAppearances: e.count,
    recentAppearances: e.recent,
    priorAppearances: e.prior,
    uniqueKeywords: [...e.keywords],
  })).sort((a, b) => b.totalAppearances - a.totalAppearances)
}

export async function getCompetitorAdHistory(brandId: string, domain: string): Promise<(CompetitorAd & { keyword: string; checkedAt: Date })[]> {
  const { data } = await getSupabase()
    .from('competitor_ads')
    .select('*, serp_checks!inner(keyword, checked_at)')
    .eq('brand_id', brandId)
    .eq('domain', domain)
    .order('first_seen_at', { ascending: false })
  if (!data) return []
  return data.map(r => ({
    ...mapCompetitorAd(r),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyword: (r as any).serp_checks?.keyword as string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    checkedAt: new Date((r as any).serp_checks?.checked_at as string),
  }))
}

export type CrossClientCompetitor = {
  domain: string
  brandIds: string[]
  brandNames: string[]
  totalAppearances: number
  firstSeen: Date
  lastSeen: Date
}

export async function getCrossClientCompetitors(): Promise<CrossClientCompetitor[]> {
  const { data: ads } = await getSupabase()
    .from('competitor_ads')
    .select('domain, brand_id, first_seen_at, brands!inner(name)')
  if (!ads) return []

  const map = new Map<string, { brands: Map<string, string>; count: number; firstSeen: Date; lastSeen: Date }>()
  for (const r of ads) {
    const domain = r.domain as string
    const brandId = r.brand_id as string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const brandName = (r as any).brands?.name as string
    const seenAt = new Date(r.first_seen_at as string)
    if (!map.has(domain)) {
      map.set(domain, { brands: new Map(), count: 0, firstSeen: seenAt, lastSeen: seenAt })
    }
    const entry = map.get(domain)!
    entry.brands.set(brandId, brandName)
    entry.count++
    if (seenAt < entry.firstSeen) entry.firstSeen = seenAt
    if (seenAt > entry.lastSeen) entry.lastSeen = seenAt
  }

  return [...map.entries()]
    .filter(([, e]) => e.brands.size > 1)
    .map(([domain, e]) => ({
      domain,
      brandIds: [...e.brands.keys()],
      brandNames: [...e.brands.values()],
      totalAppearances: e.count,
      firstSeen: e.firstSeen,
      lastSeen: e.lastSeen,
    }))
    .sort((a, b) => b.brandNames.length - a.brandNames.length || b.totalAppearances - a.totalAppearances)
}

export async function getRecentAdSamples(brandId: string, domain: string, limit = 3): Promise<CompetitorAd[]> {
  const { data } = await getSupabase()
    .from('competitor_ads')
    .select('*')
    .eq('brand_id', brandId)
    .eq('domain', domain)
    .not('headline', 'is', null)
    .order('first_seen_at', { ascending: false })
    .limit(limit)
  return (data ?? []).map(mapCompetitorAd)
}

export async function getCompetitorCount30Days(brandId: string): Promise<{ totalChecks: number; checksWithCompetitors: number }> {
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const { data } = await getSupabase()
    .from('serp_checks')
    .select('competitor_count')
    .eq('brand_id', brandId)
    .gte('checked_at', since.toISOString())
  if (!data) return { totalChecks: 0, checksWithCompetitors: 0 }
  return {
    totalChecks: data.length,
    checksWithCompetitors: data.filter(r => (r.competitor_count as number) > 0).length,
  }
}

// --- Ad copy change detection ---
export async function getLastHeadlineForDomain(brandId: string, domain: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from('competitor_ads')
    .select('headline')
    .eq('brand_id', brandId)
    .eq('domain', domain)
    .not('headline', 'is', null)
    .order('first_seen_at', { ascending: false })
    .limit(1)
  return (data?.[0]?.headline as string) ?? null
}

// --- White-label + report settings ---
export async function updateBrandSettings(id: string, settings: {
  agencyName?: string | null
  agencyLogoUrl?: string | null
  agencyPrimaryColor?: string | null
  reportEmail?: string | null
  avgBrandCpc?: number | null
  monthlyBrandSearches?: number | null
}): Promise<void> {
  const patch: Record<string, unknown> = {}
  if ('agencyName' in settings) patch.agency_name = settings.agencyName ?? null
  if ('agencyLogoUrl' in settings) patch.agency_logo_url = settings.agencyLogoUrl ?? null
  if ('agencyPrimaryColor' in settings) patch.agency_primary_color = settings.agencyPrimaryColor ?? null
  if ('reportEmail' in settings) patch.report_email = settings.reportEmail ?? null
  if ('avgBrandCpc' in settings) patch.avg_brand_cpc = settings.avgBrandCpc ?? null
  if ('monthlyBrandSearches' in settings) patch.monthly_brand_searches = settings.monthlyBrandSearches ?? null
  const { error } = await getSupabase().from('brands').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

// --- Pause tests ---
export async function createPauseTest(brandId: string, baselineExposureRate: number, notes?: string): Promise<PauseTest> {
  const { data, error } = await getSupabase()
    .from('pause_tests')
    .insert({ brand_id: brandId, baseline_exposure_rate: baselineExposureRate, notes: notes ?? null })
    .select()
  if (error) throw new Error(error.message)
  if (!data?.[0]) throw new Error('Failed to create pause test')
  return mapPauseTest(data[0])
}

export async function endPauseTest(id: string, duringExposureRate: number): Promise<void> {
  const { error } = await getSupabase()
    .from('pause_tests')
    .update({ ended_at: new Date().toISOString(), during_exposure_rate: duringExposureRate })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getActivePauseTest(brandId: string): Promise<PauseTest | null> {
  const { data } = await getSupabase()
    .from('pause_tests')
    .select('*')
    .eq('brand_id', brandId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
  return data?.[0] ? mapPauseTest(data[0]) : null
}

export async function getPauseTests(brandId: string): Promise<PauseTest[]> {
  const { data } = await getSupabase()
    .from('pause_tests')
    .select('*')
    .eq('brand_id', brandId)
    .order('started_at', { ascending: false })
  return (data ?? []).map(mapPauseTest)
}
