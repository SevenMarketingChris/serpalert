import { pgTable, uuid, text, timestamp, integer, boolean, date, numeric, uniqueIndex, index, jsonb } from 'drizzle-orm/pg-core'

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
  invitedEmail: text('invited_email'),
  watchlistDomains: text('watchlist_domains').array().default([]),
  plan: text('plan').notNull().default('free'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  agencyManaged: boolean('agency_managed').notNull().default(false),
  trialEndsAt: timestamp('trial_ends_at'),
  subscriptionStatus: text('subscription_status').notNull().default('trialing'),
  alertConfig: jsonb('alert_config').$type<{ emailAlertsEnabled?: boolean; alertEmail?: string | null; slackWebhookUrl?: string | null; alertThreshold?: number }>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('brands_active_idx').on(table.active),
  index('brands_user_id_idx').on(table.userId),
  index('brands_stripe_customer_id_idx').on(table.stripeCustomerId),
  index('brands_stripe_subscription_id_idx').on(table.stripeSubscriptionId),
])

export const serpChecks = pgTable('serp_checks', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
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
  serpCheckId: uuid('serp_check_id').notNull().references(() => serpChecks.id, { onDelete: 'cascade' }),
  brandId: uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
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
  brandId: uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  competitorDomain: text('competitor_domain').notNull(),
  impressionShare: numeric('impression_share'),
  overlapRate: numeric('overlap_rate'),
  outrankingShare: numeric('outranking_share'),
}, (table) => [
  uniqueIndex('auction_insights_brand_date_domain_idx').on(table.brandId, table.date, table.competitorDomain),
])

export const auditLeads = pgTable('audit_leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  keyword: text('keyword').notNull(),
  competitorCount: integer('competitor_count').notNull().default(0),
  anonymousId: text('anonymous_id'),
  sessionId: text('session_id'),
  firstTouch: text('first_touch'),
  lastTouch: text('last_touch'),
  weeklyChecksRemaining: integer('weekly_checks_remaining').notNull().default(8),
  lastCheckedAt: timestamp('last_checked_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  unsubscribed: boolean('unsubscribed').notNull().default(false),
}, (table) => [
  uniqueIndex('audit_leads_email_keyword_idx').on(table.email, table.keyword),
  index('audit_leads_anonymous_id_idx').on(table.anonymousId),
  index('audit_leads_created_at_idx').on(table.createdAt),
])

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventName: text('event_name').notNull(),
  anonymousId: text('anonymous_id').notNull(),
  sessionId: text('session_id').notNull(),
  userId: text('user_id'),
  brandId: uuid('brand_id').references(() => brands.id),
  leadId: uuid('lead_id').references(() => auditLeads.id),
  path: text('path').notNull(),
  url: text('url'),
  properties: jsonb('properties').$type<Record<string, string | number | boolean | null>>().notNull().default({}),
  firstTouchSource: text('first_touch_source'),
  firstTouchMedium: text('first_touch_medium'),
  firstTouchCampaign: text('first_touch_campaign'),
  firstTouchReferrer: text('first_touch_referrer'),
  lastTouchSource: text('last_touch_source'),
  lastTouchMedium: text('last_touch_medium'),
  lastTouchCampaign: text('last_touch_campaign'),
  lastTouchReferrer: text('last_touch_referrer'),
  happenedAt: timestamp('happened_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('analytics_events_event_name_idx').on(table.eventName),
  index('analytics_events_happened_at_idx').on(table.happenedAt),
  index('analytics_events_anonymous_happened_idx').on(table.anonymousId, table.happenedAt),
  index('analytics_events_user_happened_idx').on(table.userId, table.happenedAt),
  index('analytics_events_brand_happened_idx').on(table.brandId, table.happenedAt),
])

export const processedEvents = pgTable('processed_events', {
  eventId: text('event_id').primaryKey(),
  processedAt: timestamp('processed_at').notNull().defaultNow(),
})

export type Brand = typeof brands.$inferSelect
export type SerpCheck = typeof serpChecks.$inferSelect
export type CompetitorAd = typeof competitorAds.$inferSelect
export type AuctionInsight = typeof auctionInsights.$inferSelect
export type AuditLead = typeof auditLeads.$inferSelect
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect
export type ProcessedEvent = typeof processedEvents.$inferSelect
