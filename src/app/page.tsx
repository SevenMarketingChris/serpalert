import {
  ArrowRight,
  Clock,
  Camera,
  Users,
  FileCheck,
  Bell,
  Building2,
  Shield,
} from "lucide-react";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { BudgetCalculator } from "@/components/budget-calculator";
import { ExitIntentPopup } from "@/components/exit-intent-popup";
import { MarketingCta } from "@/components/marketing-cta";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Block Competitor Brand Bidding",
  description:
    "Monitor competitor ad activity on your brand keywords. Get hourly SERP checks, screenshot evidence, and instant Slack alerts.",
  path: "/",
  keywords: [
    "brand bidding monitoring",
    "competitor brand ads",
    "brand protection software",
    "google ads brand monitoring",
  ],
});

const saasJsonLd = `{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "SerpAlert",
  "description": "Monitor competitor ad activity on your brand keywords on Google Search. Get hourly SERP checks, screenshot evidence, and instant Slack alerts.",
  "url": "https://serpalert.co.uk",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "149",
    "priceCurrency": "GBP",
    "description": "Monthly subscription"
  },
  "brand": {
    "@type": "Brand",
    "name": "SerpAlert"
  }
}`;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <PageViewTracker properties={{ page: "home" }} />
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: saasJsonLd }}
      />
      <MarketingHeader />

      {/* Hero */}
      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-600 mb-6">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            Protecting brands 24/7
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            Stop paying for clicks
            <br />
            you already own
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Turn off brand campaigns and redirect that budget to winning new
            customers. SerpAlert watches your brand keyword every hour and
            alerts you the moment a competitor moves in.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4">
            <TrackedLink
              href="/audit"
              eventProperties={{ placement: "home_hero_primary", ctaLabel: "Run Free Brand Audit", funnelStage: "audit_start" }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Run Free Brand Audit
              <ArrowRight className="h-4 w-4" />
            </TrackedLink>
            <TrackedLink
              href="/sign-up"
              eventProperties={{ placement: "home_hero_secondary", ctaLabel: "Start Your Free Trial", funnelStage: "signup_start" }}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-card"
            >
              Start Your Free Trial
            </TrackedLink>
            <span className="text-sm text-muted-foreground">
              Free audit first. Trial when you are ready for hourly monitoring.
            </span>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-background">
        <div className="mx-auto max-w-5xl px-6 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { value: "< 60 min", label: "Alert time" },
              { value: "80%", label: "Clicks retained organically" },
              { value: "24/7", label: "Hourly monitoring" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-card border border-border rounded-lg p-6 text-center"
              >
                <div className="font-mono font-bold text-2xl text-gradient-tech">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator section — dark contrast */}
      <section className="bg-[#0B1120] text-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Should you turn off brand campaigns?
            </h2>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Enter your numbers to see how much budget you could redirect to
              growth.
            </p>
          </div>
          <BudgetCalculator />
        </div>
      </section>

      {/* Problem section */}
      <section className="bg-background">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              The brand campaign trap
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Most businesses are stuck in a cycle of paying for traffic they
              already own.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "You're paying for clicks you'd get anyway",
                description:
                  "Research shows 80% of brand ad clicks would have gone to your organic listing for free. That's budget down the drain.",
                icon: Shield,
                accent: "text-red-500",
              },
              {
                title: "Turn off brand ads, redirect to growth",
                description:
                  "Take every penny of that brand budget and put it into acquisition campaigns — non-brand keywords, product categories, competitor terms.",
                icon: ArrowRight,
                accent: "text-primary",
              },
              {
                title: "We watch for competitors, you grow",
                description:
                  "SerpAlert monitors your brand SERPs every hour. If a competitor bids on your name, you'll get an alert with screenshot proof.",
                icon: Shield,
                accent: "text-emerald-500",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-card border border-border rounded-lg p-6 space-y-3"
              >
                <card.icon className={`h-5 w-5 ${card.accent}`} />
                <h3 className="font-semibold text-foreground">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-card border-y border-border">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              How it works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Add your brand keyword",
                description:
                  "Enter the brand term you want to protect. We'll start monitoring it immediately.",
              },
              {
                step: "02",
                title: "Optionally pause brand campaigns",
                description:
                  "If you choose to, pause your brand ads and redirect that budget into acquisition campaigns — non-brand keywords, product categories, competitor terms.",
              },
              {
                step: "03",
                title: "Get alerted when competitors appear",
                description:
                  "If a competitor starts bidding on your brand, you'll get an alert with SERP screenshots as evidence.",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <span className="block font-mono text-6xl font-bold text-border/50 leading-none mb-4">
                  {item.step}
                </span>
                <h3 className="font-semibold text-lg text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-background">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Everything you need to protect your brand
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Clock,
                title: "Hourly checks",
                description:
                  "We check Google SERPs every hour — 24 times a day — so you catch threats fast.",
              },
              {
                icon: Camera,
                title: "SERP screenshots",
                description:
                  "Full-page screenshots of every check, stored as evidence.",
              },
              {
                icon: Users,
                title: "Competitor intelligence",
                description:
                  "See which competitors are bidding and track their ad copy.",
              },
              {
                icon: FileCheck,
                title: "Evidence packages",
                description:
                  "Shareable reports with timestamps and screenshots for your team.",
              },
              {
                icon: Bell,
                title: "Slack Alerts",
                description:
                  "Get notified instantly via Slack when a competitor appears.",
              },
              {
                icon: Building2,
                title: "Agency client portals",
                description:
                  "Give clients their own branded view with read-only access.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-card border border-border rounded-lg p-6 space-y-2"
              >
                <feature.icon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingCta
        title="Reclaim your brand budget today"
        description="Start with a free audit to see whether competitors are actually bidding on your brand. Move to the trial when you want hourly monitoring and alerts."
        note="7-day free trial. No credit card required."
      />
      <MarketingFooter />
      <ExitIntentPopup />
    </div>
  );
}
