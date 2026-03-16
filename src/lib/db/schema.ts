import { pgTable, uuid, text, timestamp, integer, boolean, date, numeric } from 'drizzle-orm/pg-core'

export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  clientToken: uuid('client_token').notNull().defaultRandom().unique(),
  googleAdsCustomerId: text('google_ads_customer_id'),
  keywords: text('keywords').array().notNull().default([]),
  active: boolean('active').notNull().default(true),
  slackWebhookUrl: text('slack_webhook_url'),
  websiteUrl: text('website_url'),
  monthlyBrandSpend: numeric('monthly_brand_spend'),
  brandRoas: numeric('brand_roas'),
  logoUrl: text('logo_url'),
  description: text('description'),
  phone: text('phone'),
  // White-label
  agencyName: text('agency_name'),
  agencyLogoUrl: text('agency_logo_url'),
  agencyPrimaryColor: text('agency_primary_color'),
  // Reports
  reportEmail: text('report_email'),
  // Competitor spend estimator
  avgBrandCpc: numeric('avg_brand_cpc'),
  monthlyBrandSearches: integer('monthly_brand_searches'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const serpChecks = pgTable('serp_checks', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id').notNull().references(() => brands.id),
  scanGroupId: uuid('scan_group_id'),
  keyword: text('keyword').notNull(),
  checkedAt: timestamp('checked_at').notNull().defaultNow(),
  device: text('device').notNull().default('desktop'),
  location: text('location').notNull().default('United Kingdom'),
  competitorCount: integer('competitor_count').notNull().default(0),
  screenshotUrl: text('screenshot_url'),
})

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
  landingPageScreenshotUrl: text('landing_page_screenshot_url'),
  firstSeenAt: timestamp('first_seen_at').notNull().defaultNow(),
})

export const auctionInsights = pgTable('auction_insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id').notNull().references(() => brands.id),
  date: date('date').notNull(),
  competitorDomain: text('competitor_domain').notNull(),
  impressionShare: numeric('impression_share'),
  overlapRate: numeric('overlap_rate'),
  outrankingShare: numeric('outranking_share'),
})

export const pauseTests = pgTable('pause_tests', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id').notNull().references(() => brands.id),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  endedAt: timestamp('ended_at'),
  baselineExposureRate: numeric('baseline_exposure_rate'),
  duringExposureRate: numeric('during_exposure_rate'),
  notes: text('notes'),
})

export type Brand = typeof brands.$inferSelect
export type SerpCheck = typeof serpChecks.$inferSelect
export type CompetitorAd = typeof competitorAds.$inferSelect
export type AuctionInsight = typeof auctionInsights.$inferSelect
export type PauseTest = typeof pauseTests.$inferSelect
