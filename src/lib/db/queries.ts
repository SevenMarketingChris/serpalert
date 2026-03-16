import { db, brands, serpChecks, competitorAds, auctionInsights } from './index'
import { eq, and, gte, desc } from 'drizzle-orm'
import type { Brand, SerpCheck, CompetitorAd, AuctionInsight } from './schema'

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

export async function getCompetitorAdsForCheck(serpCheckId: string): Promise<CompetitorAd[]> {
  return db.select().from(competitorAds).where(eq(competitorAds.serpCheckId, serpCheckId))
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
  await db.insert(auctionInsights).values(insights)
}

export async function createBrand(data: {
  name: string; slug: string; keywords: string[]
  googleAdsCustomerId?: string; slackWebhookUrl?: string
}): Promise<Brand> {
  const rows = await db.insert(brands).values(data).returning()
  if (!rows[0]) throw new Error('Failed to create brand')
  return rows[0]
}
