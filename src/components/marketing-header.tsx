import { TrackedLink } from "@/components/analytics/tracked-link";

const primaryLinks = [
  { href: "/calculator", label: "Calculator" },
  { href: "/pricing", label: "Pricing" },
];

export function MarketingHeader() {
  return (
    <nav className="border-b border-border bg-card px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <TrackedLink
          href="/"
          eventProperties={{ placement: "header_logo", funnelStage: "acquisition" }}
          className="text-gradient-tech font-extrabold text-xl"
        >
          SerpAlert
        </TrackedLink>

        <div className="hidden items-center gap-5 md:flex">
          {primaryLinks.map((link) => (
            <TrackedLink
              key={link.href}
              href={link.href}
              eventProperties={{
                placement: "header_nav",
                funnelStage: "acquisition",
                ctaLabel: link.label,
              }}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </TrackedLink>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <TrackedLink
            href="/sign-in"
            eventProperties={{ placement: "header_sign_in", funnelStage: "auth" }}
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Sign In
          </TrackedLink>
          <TrackedLink
            href="/sign-up"
            eventProperties={{ placement: "header_trial", funnelStage: "signup_start" }}
            className="hidden h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:inline-flex"
          >
            Start Free Trial
          </TrackedLink>
          <TrackedLink
            href="/audit"
            eventProperties={{ placement: "header_audit", funnelStage: "audit_start" }}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Free Audit
          </TrackedLink>
        </div>
      </div>
    </nav>
  );
}
