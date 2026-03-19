import { db, brands, serpChecks, competitorAds, auctionInsights } from './index'
import { eq, and, gte, lte, desc, inArray, count, isNotNull } from 'drizzle-orm'
import type { Brand, SerpCheck, CompetitorAd, AuctionInsight } from './schema'

export const PLAN_LIMITS = {
  free:         { brands: 1,  keywords: 3   },
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
  return db.select().from(brands).where(eq(brands.active, true))
}

export async function getRecentSerpChecks(brandId: string, limit = 50): Promise<SerpCheck[]> {
  return db.select().from(serpChecks)
    .where(eq(serpChecks.brandId, brandId))
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
  return db.select().from(brands).where(eq(brands.userId, userId))
}

export async function createBrandForUser(
  data: { name: string; keywords: string[]; domain?: string },
  userId: string,
): Promise<Brand> {
  const slug = data.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  const rows = await db.insert(brands).values({
    name: data.name,
    slug,
    keywords: data.keywords,
    domain: data.domain,
    plan: 'free',
    userId,
  }).returning()
  if (!rows[0]) throw new Error('Failed to create brand')
  return rows[0]
}

export async function hasScreenshotToday(brandId: string, keyword: string): Promise<boolean> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
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
  return rows.filter(r => r.screenshotUrl != null) as { id: string; screenshotUrl: string }[]
}

export async function nullifyScreenshotUrls(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  await db.update(serpChecks)
    .set({ screenshotUrl: null })
    .where(inArray(serpChecks.id, ids))
}

export async function getUserBrandCount(userId: string): Promise<number> {
  const rows = await db.select({ count: count() }).from(brands).where(eq(brands.userId, userId))
  return rows[0]?.count ?? 0
}

export async function updateBrand(
  id: string,
  data: {
    name?: string; keywords?: string[]; domain?: string | null
    googleAdsCustomerId?: string | null; slackWebhookUrl?: string | null
    monthlyBrandSpend?: string | null; brandRoas?: string | null
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

export async function createBrand(data: {
  name: string; slug: string; keywords: string[]
  domain?: string
  googleAdsCustomerId?: string; slackWebhookUrl?: string
  monthlyBrandSpend?: string; brandRoas?: string
}): Promise<Brand> {
  const rows = await db.insert(brands).values(data).returning()
  if (!rows[0]) throw new Error('Failed to create brand')
  return rows[0]
}
