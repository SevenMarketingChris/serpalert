import Link from "next/link";
import { ArrowRight } from "lucide-react";

type MarketingCtaProps = {
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  note?: string;
};

export function MarketingCta({
  title,
  description,
  primaryHref = "/audit",
  primaryLabel = "Run Free Brand Audit",
  secondaryHref = "/sign-up",
  secondaryLabel = "Start 7-day free trial",
  note,
}: MarketingCtaProps) {
  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          {description}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={primaryHref}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={secondaryHref}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            {secondaryLabel}
          </Link>
        </div>
        {note ? (
          <p className="mt-4 text-sm text-muted-foreground">{note}</p>
        ) : null}
      </div>
    </section>
  );
}
