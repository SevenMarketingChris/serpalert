import Link from "next/link";
import { Eye, Bell, TrendingUp } from "lucide-react";
import { MarketingCta } from "@/components/marketing-cta";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { WalkthroughCalculator } from "@/components/walkthrough-calculator";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Brand Campaign Savings Calculator",
  description:
    "Calculate how much you're wasting on Google Ads brand campaigns. See what happens when you redirect that budget into high-ROI non-brand campaigns.",
  path: "/calculator",
  keywords: [
    "brand campaign calculator",
    "google ads brand spend calculator",
    "brand bidding savings calculator",
  ],
});

export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      {/* Hero */}
      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-600 mb-6">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            Stop defending. Start growing.
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            The True Cost of
            <br />
            Brand Campaigns
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Most businesses waste 60-80% of their brand ad spend. Calculate your
            hidden cost — and see what happens when you redirect it into growth.
          </p>
        </div>
      </section>

      {/* Section 1: The Brand Campaign Trap */}
      <section className="bg-card border-y border-border">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground text-center mb-12">
            The Brand Campaign Trap
          </h2>

          <div className="space-y-8 text-muted-foreground leading-relaxed">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">
                Your best-performing campaign might be your worst investment
              </h3>
              <p>
                Open any Google Ads account and the brand campaign is almost always the star performer. ROAS of 10x, 15x, sometimes 20x. Cost-per-click pennies on the pound. It looks brilliant on a dashboard. But that dashboard is lying to you.
              </p>
              <p>
                Brand campaigns measure <strong className="text-foreground">demand capture</strong>, not demand creation. When someone types your business name into Google, they already know who you are. They already want to visit your website. The ad is not convincing them of anything — it is simply intercepting a journey that was already headed your way.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">
                80% of those clicks were coming anyway
              </h3>
              <p>
                Multiple studies — including research from Google themselves and eBay&apos;s landmark 2014 analysis — have demonstrated that roughly 80% of brand ad clicks are <strong className="text-foreground">incremental zero</strong>. Turn off the ad and those visitors still arrive through your organic listing. The ad is not driving traffic; it is taxing traffic you already own.
              </p>
              <p>
                That means for every £1 you spend on brand ads, approximately £0.20 generates genuinely incremental value. The other £0.80 pays Google for clicks you would have received for free. It is a rounding error dressed up as a high-performing campaign.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">
                The competitor fear that keeps you spending
              </h3>
              <p>
                The standard defence for brand campaigns is competitor bidding: &ldquo;If we don&apos;t bid on our own name, competitors will steal our traffic.&rdquo; And yes, Google does allow competitors to bid on your brand terms. But here is what most businesses never check — <strong className="text-foreground">whether anyone actually is</strong>.
              </p>
              <p>
                In many cases, brand campaigns run month after month defending against a threat that does not exist. The fear of competitors is enough to keep the budget flowing, even when the auction insights tab shows zero competitor impression share. You are paying insurance premiums on a house that has never been burgled, in a street with no crime.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">
                The real cost: opportunity
              </h3>
              <p>
                Even at modest budgets, the opportunity cost compounds fast. Spending £1,000 per month on brand defence means £1,000 per month <strong className="text-foreground">not</strong> acquiring new customers. That is £12,000 a year redirected away from non-brand keywords, product category terms, and competitor conquesting — campaigns that put your business in front of people who have never heard of you.
              </p>
              <p>
                Non-brand campaigns have lower ROAS by definition — they target cold audiences. But they generate <strong className="text-foreground">genuinely new revenue</strong>. A non-brand campaign at 5x ROAS is infinitely more valuable than a brand campaign at 15x ROAS if the brand campaign is not creating any incremental value. You cannot grow a business by repeatedly selling to people who were already buying.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">
                Brand ROAS is artificially inflated
              </h3>
              <p>
                When you report a brand ROAS of 12x, you are measuring every conversion that touched a brand ad — including the customer who Googled your name, clicked the ad out of convenience, and would have purchased regardless. Strip away those organic-anyway conversions and your true incremental brand ROAS drops to 2-3x at best. For many businesses, it falls below 1x.
              </p>
              <p>
                The uncomfortable truth: brand campaigns exist in most accounts because they make the overall numbers look good. They inflate blended ROAS, bring down average CPA, and give account managers a nice story to tell. But they do not grow your business. The calculator below shows you exactly what you are leaving on the table.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Interactive Walkthrough Calculator */}
      <section className="bg-[#0B1120] text-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Calculate Your Brand Campaign Waste
            </h2>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Walk through each step to see how much budget you could redirect
              into campaigns that actually grow your business.
            </p>
          </div>
          <WalkthroughCalculator />
        </div>
      </section>

      {/* Section 3: The Alternative */}
      <section className="bg-background">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              The Alternative: Monitor and React
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Instead of paying to defend your brand around the clock, let
              SerpAlert watch for you — and only act when there is a real threat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="relative">
              <span className="block font-mono text-6xl font-bold text-border/50 leading-none mb-4">
                01
              </span>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-emerald-500" />
                <h3 className="font-semibold text-lg text-foreground">
                  We monitor your brand SERPs
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                SerpAlert checks Google for your brand keywords every hour, 24
                times a day. Full SERP screenshots captured and stored as
                evidence each time.
              </p>
            </div>

            <div className="relative">
              <span className="block font-mono text-6xl font-bold text-border/50 leading-none mb-4">
                02
              </span>
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-5 w-5 text-emerald-500" />
                <h3 className="font-semibold text-lg text-foreground">
                  Alert in &lt;60 minutes when competitors appear
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The moment a competitor ad shows up on your brand terms, you get
                an alert via email or Slack — complete with screenshot proof,
                ad copy, and competitor details.
              </p>
            </div>

            <div className="relative">
              <span className="block font-mono text-6xl font-bold text-border/50 leading-none mb-4">
                03
              </span>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <h3 className="font-semibold text-lg text-foreground">
                  Redirect your budget into growth
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                With SerpAlert as your safety net, confidently pause brand
                campaigns and redirect that budget into non-brand campaigns that
                actually grow your business.
              </p>
            </div>
          </div>
        </div>
      </section>

      <MarketingCta
        title="Ready to stop wasting brand budget?"
        description="Use the audit to see whether competitor bidding is the real threat. Start the trial when you want SerpAlert watching every hour."
        primaryLabel="Check your brand with a free audit"
      />
      <MarketingFooter />
    </div>
  );
}
