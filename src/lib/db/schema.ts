import { pgTable, uuid, text, timestamp, integer, boolean, date, numeric, uniqueIndex, index } from 'drizzle-orm/pg-core'

export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  clientToken: uuid('client_token').notNull().defaultRandom().unique(),
  domain: text('domain'),
  googleAdsCustomerId: text('google_ads_customer_id'),
  brandCampaignId: text('brand_campaign_id'),
  keywords: text('keywords').array().notNull().default([]),
  active: boolean('active').notNull().default(true),
  slackWebhookUrl: text('slack_webhook_url'),
  monthlyBrandSpend: numeric('monthly_brand_spend'),
  brandRoas: numeric('brand_roas'),
  userId: text('user_id'),
  plan: text('plan').notNull().default('free'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('brands_active_idx').on(table.active),
  index('brands_user_id_idx').on(table.userId),
])

export const serpChecks = pgTable('serp_checks', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id').notNull().references(() => brands.id),
  keyword: text('keyword').notNull(),
  checkedAt: timestamp('checked_at').notNull().defaultNow(),
  device: text('device').notNull().default('desktop'),
  location: text('location').notNull().default('United Kingdom'),
  competitorCount: integer('competitor_count').notNull().default(0),
  screenshotUrl: text('screenshot_url'),
}, (table) => [
  index('serp_checks_brand_checked_at_idx').on(table.brandId, table.checkedAt),
])

export const competitorAds = pgTable('competitor_ads', {
  id: uuid('id').primaryKey().defaultRandom(),
  serpCheckId: uuid('serp_check_id').notNull().references(() => serpChecks.id),
  brandId: uuid('brand_id').notNull().references(() => brands.id),
  domain: text('domain').notNull(),
  headline: text('headline'),
  description: text('description'),
  displayUrl: text('display_url'),
  destinationUrl: text('destination_url'),
  position: integer('position'),
  status: text('status', { enum: ['new', 'acknowledged', 'reported', 'resolved'] }).notNull().default('new'),
  firstSeenAt: timestamp('first_seen_at').notNull().defaultNow(),
}, (table) => [
  index('competitor_ads_brand_first_seen_at_idx').on(table.brandId, table.firstSeenAt),
  index('competitor_ads_domain_idx').on(table.domain),
  index('competitor_ads_brand_status_idx').on(table.brandId, table.status),
])

export const auctionInsights = pgTable('auction_insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id').notNull().references(() => brands.id),
  date: date('date').notNull(),
  competitorDomain: text('competitor_domain').notNull(),
  impressionShare: numeric('impression_share'),
  overlapRate: numeric('overlap_rate'),
  outrankingShare: numeric('outranking_share'),
}, (table) => [
  uniqueIndex('auction_insights_brand_date_domain_idx').on(table.brandId, table.date, table.competitorDomain),
])

export type Brand = typeof brands.$inferSelect
export type SerpCheck = typeof serpChecks.$inferSelect
export type CompetitorAd = typeof competitorAds.$inferSelect
export type AuctionInsight = typeof auctionInsights.$inferSelect
