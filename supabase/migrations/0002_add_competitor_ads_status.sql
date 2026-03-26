-- Add missing status column to competitor_ads
ALTER TABLE "competitor_ads" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'new';

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS "brands_active_idx" ON "brands" ("active");
CREATE INDEX IF NOT EXISTS "serp_checks_brand_checked_at_idx" ON "serp_checks" ("brand_id", "checked_at");
CREATE INDEX IF NOT EXISTS "competitor_ads_brand_first_seen_at_idx" ON "competitor_ads" ("brand_id", "first_seen_at");
CREATE INDEX IF NOT EXISTS "competitor_ads_domain_idx" ON "competitor_ads" ("domain");
CREATE INDEX IF NOT EXISTS "competitor_ads_brand_status_idx" ON "competitor_ads" ("brand_id", "status");
