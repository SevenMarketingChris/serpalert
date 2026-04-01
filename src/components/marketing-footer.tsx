import { TrackedLink } from "@/components/analytics/tracked-link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
        <div>
          <div className="text-sm font-semibold text-foreground">SerpAlert</div>
          <div className="text-sm text-muted-foreground">
            Brand keyword monitoring for UK Google Ads teams.
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground">
          <TrackedLink
            href="/audit"
            eventProperties={{ placement: "footer_nav", ctaLabel: "Free Audit", funnelStage: "audit_start" }}
            className="transition-colors hover:text-foreground"
          >
            Free Audit
          </TrackedLink>
          <TrackedLink
            href="/calculator"
            eventProperties={{ placement: "footer_nav", ctaLabel: "Calculator", funnelStage: "calculator" }}
            className="transition-colors hover:text-foreground"
          >
            Calculator
          </TrackedLink>
          <TrackedLink
            href="/blog"
            eventProperties={{ placement: "footer_nav", ctaLabel: "Blog", funnelStage: "acquisition" }}
            className="transition-colors hover:text-foreground"
          >
            Blog
          </TrackedLink>
          <TrackedLink
            href="/pricing"
            eventProperties={{ placement: "footer_nav", ctaLabel: "Pricing", funnelStage: "pricing" }}
            className="transition-colors hover:text-foreground"
          >
            Pricing
          </TrackedLink>
          <TrackedLink
            href="/privacy"
            eventProperties={{ placement: "footer_nav", ctaLabel: "Privacy Policy", funnelStage: "legal" }}
            className="transition-colors hover:text-foreground"
          >
            Privacy Policy
          </TrackedLink>
          <TrackedLink
            href="/terms"
            eventProperties={{ placement: "footer_nav", ctaLabel: "Terms", funnelStage: "legal" }}
            className="transition-colors hover:text-foreground"
          >
            Terms
          </TrackedLink>
        </div>
      </div>
    </footer>
  );
}
