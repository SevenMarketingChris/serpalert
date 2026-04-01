import Link from "next/link";

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
          <Link href="/audit" className="transition-colors hover:text-foreground">
            Free Audit
          </Link>
          <Link href="/calculator" className="transition-colors hover:text-foreground">
            Calculator
          </Link>
          <Link href="/blog" className="transition-colors hover:text-foreground">
            Blog
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-foreground">
            Pricing
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-foreground">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
