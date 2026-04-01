import Link from "next/link";

const primaryLinks = [
  { href: "/calculator", label: "Calculator" },
  { href: "/pricing", label: "Pricing" },
];

export function MarketingHeader() {
  return (
    <nav className="border-b border-border bg-card px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/" className="text-gradient-tech font-extrabold text-xl">
          SerpAlert
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/sign-in"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="hidden h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:inline-flex"
          >
            Start Free Trial
          </Link>
          <Link
            href="/audit"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Free Audit
          </Link>
        </div>
      </div>
    </nav>
  );
}
