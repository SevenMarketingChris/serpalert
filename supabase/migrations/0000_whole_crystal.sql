CREATE TABLE "auction_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"date" date NOT NULL,
	"competitor_domain" text NOT NULL,
	"impression_share" numeric,
	"overlap_rate" numeric,
	"outranking_share" numeric
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"client_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"domain" text,
	"google_ads_customer_id" text,
	"keywords" text[] DEFAULT '{}' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"slack_webhook_url" text,
	"monthly_brand_spend" numeric,
	"brand_roas" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug"),
	CONSTRAINT "brands_client_token_unique" UNIQUE("client_token")
);
--> statement-breakpoint
CREATE TABLE "competitor_ads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serp_check_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"headline" text,
	"description" text,
	"display_url" text,
	"destination_url" text,
	"position" integer,
	"first_seen_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "serp_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"keyword" text NOT NULL,
	"checked_at" timestamp DEFAULT now() NOT NULL,
	"device" text DEFAULT 'desktop' NOT NULL,
	"location" text DEFAULT 'United Kingdom' NOT NULL,
	"competitor_count" integer DEFAULT 0 NOT NULL,
	"screenshot_url" text
);
--> statement-breakpoint
ALTER TABLE "auction_insights" ADD CONSTRAINT "auction_insights_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_ads" ADD CONSTRAINT "competitor_ads_serp_check_id_serp_checks_id_fk" FOREIGN KEY ("serp_check_id") REFERENCES "public"."serp_checks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_ads" ADD CONSTRAINT "competitor_ads_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serp_checks" ADD CONSTRAINT "serp_checks_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auction_insights_brand_date_domain_idx" ON "auction_insights" USING btree ("brand_id","date","competitor_domain");