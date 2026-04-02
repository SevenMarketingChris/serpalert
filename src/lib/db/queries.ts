import { db, brands, serpChecks, competitorAds, auctionInsights } from './index'
import { eq, and, gte, lte, desc, inArray, count, countDistinct, isNotNull, isNull, sql } from 'drizzle-orm'
import type { Brand, SerpCheck, CompetitorAd, AuctionInsight } from './schema'

export const PLAN_LIMITS = {
  free:         { brands: 1,  keywords: 2   },
  starter:      { brands: 3,  keywords: 25  },
  professional: { brands: 10, keywords: 100 },
  agency:       { brands: 50, keywords: 500 },
} as const

export async function getBrandById(id: string): Promise<Brand | null> {
  const rows = await db.select().from(brands).where(eq(brands.id, id)).limit(1)
  return rows[0] ?? null
}

export async function getBrandByToken(token: string): Promise<Brand | null> {
  const rows = await db.select().from(brands).where(eq(brands.clientToken, token)).limit(1)
  return rows[0] ?? null
}

export async function getAllActiveBrands(): Promise<Brand[]> {
  const now = new Date()
  return db.select().from(brands).where(
    and(
      eq(brands.active, true),
      sql`(
        ${brands.agencyManaged} = true
        OR ${brands.subscriptionStatus} IN ('active', 'past_due')
        OR (${brands.subscriptionStatus} = 'trialing' AND (${brands.trialEndsAt} IS NULL OR ${brands.trialEndsAt} > ${now}))
      )`
    )
  )
}

export async function getRecentSerpChecks(brandId: string, limit = 50, since?: Date): Promise<SerpCheck[]> {
  const conditions = [eq(serpChecks.brandId, brandId)]
  if (since) conditions.push(gte(serpChecks.checkedAt, since))
  return db.select().from(serpChecks)
    .where(and(...conditions))
    .orderBy(desc(serpChecks.checkedAt))
    .limit(limit)
}

export async function getCompetitorAdsForChecks(serpCheckIds: string[]): Promise<CompetitorAd[]> {
  if (serpCheckIds.length === 0) return []
  return db.select().from(competitorAds).where(inArray(competitorAds.serpCheckId, serpCheckIds))
}

export async function getCompetitorDomainsLastNDays(brandId: string, days: number): Promise<string[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const rows = await db.selectDistinct({ domain: competitorAds.domain })
    .from(competitorAds)
    .where(and(eq(competitorAds.brandId, brandId), gte(competitorAds.firstSeenAt, since)))
  return rows.map(r => r.domain)
}

export async function getAuctionInsightsLast30Days(brandId: string): Promise<AuctionInsight[]> {
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceStr = since.toISOString().split('T')[0]
  return db.select().from(auctionInsights)
    .where(and(eq(auctionInsights.brandId, brandId), gte(auctionInsights.date, sinceStr)))
    .orderBy(desc(auctionInsights.date))
}

export async function insertSerpCheck(data: {
  brandId: string; keyword: string; competitorCount: number; screenshotUrl?: string
}): Promise<SerpCheck> {
  const rows = await db.insert(serpChecks).values(data).returning()
  if (!rows[0]) throw new Error('Failed to insert serp check')
  return rows[0]
}

export async function insertCompetitorAds(ads: {
  serpCheckId: string; brandId: string; domain: string; headline?: string
  description?: string; displayUrl?: string; destinationUrl?: string
  position?: number; firstSeenAt: Date
}[]): Promise<void> {
  if (ads.length === 0) return
  await db.insert(competitorAds).values(ads)
}

export async function insertAuctionInsights(insights: {
  brandId: string; date: string; competitorDomain: string
  impressionShare?: string; overlapRate?: string; outrankingShare?: string
}[]): Promise<void> {
  if (insights.length === 0) return
  await db.insert(auctionInsights).values(insights).onConflictDoNothing()
}

export async function getBrandsForUser(userId: string): Promise<Brand[]> {
  return db.select().from(brands).where(and(eq(brands.userId, userId), eq(brands.active, true)))
}

export async function createBrandForUser(
  data: { name: string; keywords: string[]; domain?: string },
  userId: string,
  brandLimit: number = PLAN_LIMITS.free.brands,
): Promise<Brand> {
  // Atomic check-then-insert inside a transaction to prevent race conditions
  return db.transaction(async (tx) => {
    const countRows = await tx.select({ count: count() }).from(brands)
      .where(and(eq(brands.userId, userId), eq(brands.active, true)))
    const currentCount = countRows[0]?.count ?? 0
    if (currentCount >= brandLimit) {
      throw new Error(`You can only create ${brandLimit} brand(s) on your current plan. Contact us to add more.`)
    }
    const baseSlug = data.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 7)
    const rows = await tx.insert(brands).values({
      name: data.name,
      slug,
      keywords: data.keywords,
      domain: data.domain,
      plan: 'free',
      userId,
      subscriptionStatus: 'trialing',
      trialEndsAt,
    }).returning()
    if (!rows[0]) throw new Error('Failed to create brand')
    return rows[0]
  })
}

export async function getScreenshotsForBrand(brandId: string, limit = 50): Promise<SerpCheck[]> {
  return db.select()
    .from(serpChecks)
    .where(and(eq(serpChecks.brandId, brandId), isNotNull(serpChecks.screenshotUrl)))
    .orderBy(desc(serpChecks.checkedAt))
    .limit(limit)
}

export async function hasScreenshotToday(brandId: string, keyword: string): Promise<boolean> {
  const todayStr = new Date().toISOString().slice(0, 10) // UTC date string
  const todayStart = new Date(todayStr + 'T00:00:00.000Z')
  const rows = await db.select({ id: serpChecks.id })
    .from(serpChecks)
    .where(and(
      eq(serpChecks.brandId, brandId),
      eq(serpChecks.keyword, keyword),
      gte(serpChecks.checkedAt, todayStart),
      isNotNull(serpChecks.screenshotUrl),
    ))
    .limit(1)
  return rows.length > 0
}

export async function getScreenshotUrlsOlderThan(days: number): Promise<{ id: string; screenshotUrl: string }[]> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const rows = await db.select({ id: serpChecks.id, screenshotUrl: serpChecks.screenshotUrl })
    .from(serpChecks)
    .where(and(lte(serpChecks.checkedAt, cutoff), isNotNull(serpChecks.screenshotUrl)))
    .limit(200)
  return rows.filter(r => r.screenshotUrl != null) as { id: string; screenshotUrl: string }[]
}

export async function nullifyScreenshotUrls(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  await db.update(serpChecks)
    .set({ screenshotUrl: null })
    .where(inArray(serpChecks.id, ids))
}

export async function getUserBrandCount(userId: string): Promise<number> {
  const rows = await db.select({ count: count() }).from(brands).where(and(eq(brands.userId, userId), eq(brands.active, true)))
  return rows[0]?.count ?? 0
}

export async function updateBrand(
  id: string,
  data: {
    name?: string; keywords?: string[]; domain?: string | null
    googleAdsCustomerId?: string | null; slackWebhookUrl?: string | null
    monthlyBrandSpend?: string | null; brandRoas?: string | null
    brandCampaignId?: string | null
    watchlistDomains?: string[]
    alertConfig?: { emailAlertsEnabled?: boolean; alertEmail?: string | null; slackWebhookUrl?: string | null; alertThreshold?: number } | null
    active?: boolean
  },
): Promise<Brand> {
  const rows = await db.update(brands)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(brands.id, id))
    .returning()
  if (!rows[0]) throw new Error('Brand not found')
  return rows[0]
}

// Ahrefs integration stubs: called by cron but tables not yet created.
// Will be re-implemented once ahrefs_domains and ahrefs_keywords tables exist.
export async function upsertAhrefsDomainMetrics(_data: {
  brandId: string; domain: string; isBrandDomain: boolean; date: string
  domainRating: string | null; organicTraffic: number | null
  organicKeywords: number | null; referringDomains: number | null; backlinks: number | null
}): Promise<void> {
  throw new Error('Not implemented: Ahrefs integration pending database schema')
}

export async function replaceTopKeywords(
  _brandId: string, _domain: string, _date: string,
  _keywords: { keyword: string; position: number | null; volume: number | null; traffic: number | null }[],
): Promise<void> {
  throw new Error('Not implemented: Ahrefs integration pending database schema')
}

export async function getCompetitorAdById(id: string): Promise<CompetitorAd | null> {
  const rows = await db.select().from(competitorAds).where(eq(competitorAds.id, id)).limit(1)
  return rows[0] ?? null
}

export async function getSerpCheckWithAds(checkId: string): Promise<{
  check: SerpCheck
  ads: CompetitorAd[]
  brandClientToken: string
} | null> {
  const rows = await db.select().from(serpChecks).where(eq(serpChecks.id, checkId)).limit(1)
  const check = rows[0]
  if (!check) return null
  const brand = await db.select({ clientToken: brands.clientToken }).from(brands).where(eq(brands.id, check.brandId)).limit(1)
  if (!brand[0]) return null
  const ads = await db.select().from(competitorAds).where(eq(competitorAds.serpCheckId, checkId))
  return { check, ads, brandClientToken: brand[0].clientToken }
}

export async function getCompetitorSummaryForBrand(brandId: string): Promise<{
  domain: string
  totalCount: number
  recentCount: number
  keywords: string[]
  firstSeen: Date
  lastSeen: Date
  avgPosition: number | null
  isActive: boolean
}[]> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  // Get all competitor ads for this brand with their check keywords
  const rows = await db.select({
    domain: competitorAds.domain,
    keyword: serpChecks.keyword,
    position: competitorAds.position,
    firstSeenAt: competitorAds.firstSeenAt,
  })
    .from(competitorAds)
    .innerJoin(serpChecks, eq(competitorAds.serpCheckId, serpChecks.id))
    .where(and(eq(competitorAds.brandId, brandId), gte(competitorAds.firstSeenAt, ninetyDaysAgo)))

  if (rows.length === 0) return []

  // Group by domain in JS (avoids N+1)
  const domainMap = new Map<string, {
    count: number
    recentCount: number
    keywords: Set<string>
    positions: number[]
    firstSeen: Date
    lastSeen: Date
  }>()

  for (const row of rows) {
    const existing = domainMap.get(row.domain)
    const date = new Date(row.firstSeenAt)
    const isRecent = date >= thirtyDaysAgo

    if (existing) {
      existing.count++
      if (isRecent) existing.recentCount++
      existing.keywords.add(row.keyword)
      if (row.position != null) existing.positions.push(row.position)
      if (date < existing.firstSeen) existing.firstSeen = date
      if (date > existing.lastSeen) existing.lastSeen = date
    } else {
      domainMap.set(row.domain, {
        count: 1,
        recentCount: isRecent ? 1 : 0,
        keywords: new Set([row.keyword]),
        positions: row.position != null ? [row.position] : [],
        firstSeen: date,
        lastSeen: date,
      })
    }
  }

  return [...domainMap.entries()]
    .map(([domain, stats]) => ({
      domain,
      totalCount: stats.count,
      recentCount: stats.recentCount,
      keywords: [...stats.keywords],
      firstSeen: stats.firstSeen,
      lastSeen: stats.lastSeen,
      avgPosition: stats.positions.length > 0
        ? Math.round((stats.positions.reduce((a, b) => a + b, 0) / stats.positions.length) * 10) / 10
        : null,
      isActive: stats.lastSeen >= sevenDaysAgo,
    }))
    .sort((a, b) => b.recentCount - a.recentCount || b.totalCount - a.totalCount)
}

export async function deleteBrand(id: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(competitorAds).where(eq(competitorAds.brandId, id))
    await tx.delete(auctionInsights).where(eq(auctionInsights.brandId, id))
    await tx.delete(serpChecks).where(eq(serpChecks.brandId, id))
    await tx.delete(brands).where(eq(brands.id, id))
  })
}

export async function getLastCheckForBrand(brandId: string): Promise<SerpCheck | null> {
  const rows = await db.select().from(serpChecks)
    .where(eq(serpChecks.brandId, brandId))
    .orderBy(desc(serpChecks.checkedAt))
    .limit(1)
  return rows[0] ?? null
}

export async function getLastChecksForBrands(brandIds: string[]): Promise<Map<string, SerpCheck>> {
  if (brandIds.length === 0) return new Map()

  // Use DISTINCT ON to efficiently get latest check per brand in SQL
  const rows = await db.execute(sql`
    SELECT DISTINCT ON (brand_id) *
    FROM serp_checks
    WHERE brand_id = ANY(${brandIds})
      AND checked_at >= now() - INTERVAL '7 days'
    ORDER BY brand_id, checked_at DESC
  `)

  const latestByBrand = new Map<string, SerpCheck>()
  for (const row of rows as unknown as SerpCheck[]) {
    latestByBrand.set(row.brandId, row)
  }
  return latestByBrand
}

export async function getSerpCheckCountForBrand(brandId: string): Promise<number> {
  const rows = await db
    .select({ count: count() })
    .from(serpChecks)
    .where(eq(serpChecks.brandId, brandId))
  return rows[0]?.count ?? 0
}

export async function createBrand(data: {
  name: string; slug: string; keywords: string[]
  domain?: string
  googleAdsCustomerId?: string; slackWebhookUrl?: string
  monthlyBrandSpend?: string; brandRoas?: string
  agencyManaged?: boolean; subscriptionStatus?: string
  trialEndsAt?: Date
  invitedEmail?: string | null
}): Promise<Brand> {
  const baseSlug = data.slug
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
  const rows = await db.insert(brands).values({ ...data, slug }).returning()
  if (!rows[0]) throw new Error('Failed to create brand')
  return rows[0]
}

export async function linkInvitedBrands(email: string, userId: string): Promise<void> {
  await db.update(brands)
    .set({ userId, updatedAt: new Date() })
    .where(
      and(
        eq(brands.invitedEmail, email.toLowerCase()),
        isNull(brands.userId)
      )
    )
}

export async function getThreatCountLast7Days(brandId: string): Promise<number> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const rows = await db.select({ count: countDistinct(competitorAds.domain) })
    .from(competitorAds)
    .where(and(
      eq(competitorAds.brandId, brandId),
      gte(competitorAds.firstSeenAt, cutoff),
    ))
  return rows[0]?.count ?? 0
}

export async function getAdCopyHistory(brandId: string, domain: string): Promise<{
  headline: string | null
  description: string | null
  displayUrl: string | null
  firstSeen: Date
  lastSeen: Date
  count: number
}[]> {
  const rows = await db.select({
    headline: competitorAds.headline,
    description: competitorAds.description,
    displayUrl: competitorAds.displayUrl,
    firstSeen: sql<Date>`min(${competitorAds.firstSeenAt})`,
    lastSeen: sql<Date>`max(${competitorAds.firstSeenAt})`,
    count: count(),
  })
    .from(competitorAds)
    .where(and(
      eq(competitorAds.brandId, brandId),
      eq(competitorAds.domain, domain),
    ))
    .groupBy(competitorAds.headline, competitorAds.description, competitorAds.displayUrl)
    .orderBy(desc(sql`max(${competitorAds.firstSeenAt})`))
    .limit(20)

  return rows.map(r => ({
    headline: r.headline,
    description: r.description,
    displayUrl: r.displayUrl,
    firstSeen: r.firstSeen,
    lastSeen: r.lastSeen,
    count: r.count,
  }))
}

export async function updateBrandSubscription(
  brandId: string,
  data: {
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    subscriptionStatus?: string
    plan?: string
    trialEndsAt?: Date
  },
): Promise<void> {
  await db.update(brands)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(brands.id, brandId))
}

export async function getBrandByStripeSubscriptionId(subscriptionId: string): Promise<Brand | null> {
  const rows = await db.select().from(brands)
    .where(eq(brands.stripeSubscriptionId, subscriptionId))
    .limit(1)
  return rows[0] ?? null
}

export async function getBrandByStripeCustomerId(customerId: string): Promise<Brand | null> {
  const rows = await db.select().from(brands)
    .where(eq(brands.stripeCustomerId, customerId))
    .limit(1)
  return rows[0] ?? null
}
