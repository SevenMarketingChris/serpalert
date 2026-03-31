import Link from "next/link";
import { Check } from "lucide-react";
import { ExitIntentPopup } from "@/components/exit-intent-popup";

export const metadata = {
  title: "Pricing",
  description:
    "Brand keyword monitoring from £149/mo. Agency plans from £69/brand. 7-day free trial.",
  openGraph: {
    title: "Pricing — SerpAlert",
    description: "Brand keyword monitoring from £149/mo. Agency plans from £69/brand. 7-day free trial.",
  },
};

const features = [
  "Monitor your brand keyword",
  "Hourly SERP checks (24x daily)",
  "SERP screenshot evidence",
  "Competitor ad copy tracking",
  "Slack alerts for new competitors",
  "CSV export",
  "Client portal for sharing",
  "Google Ads auto-toggle",
  "Cease & desist letter templates",
  "PDF evidence reports",
];

const agencyFeatures = [
  "All standard monitoring features",
  "White-label client portals",
  "Bulk brand management",
  "Dedicated onboarding support",
  "Volume discounts from day one",
  "Cancel or add brands anytime",
];

const faqs = [
  {
    question: "Can I cancel anytime?",
    answer: "Yes, cancel from your billing settings.",
  },
  {
    question: "What happens after my trial?",
    answer:
      "Monitoring pauses but you can still view all historical data. Subscribe from your dashboard to resume monitoring instantly.",
  },
  {
    question: "Can I monitor more than one keyword?",
    answer: "The standard plan includes 1 brand keyword. Contact us if you need additional keywords.",
  },
  {
    question: "How often are checks run?",
    answer: "Every hour, 24 times a day. Plus manual checks anytime from the dashboard.",
  },
  {
    question: "Do you support other countries?",
    answer: "Currently UK only. More coming soon.",
  },
  {
    question: "Do you offer agency pricing?",
    answer: "Yes — agencies monitoring multiple client brands get volume discounts starting at £109/brand/month. Contact us to set up an agency account.",
  },
  {
    question: "Can my clients see their own reports?",
    answer: "Yes, every brand gets a client portal with a unique link. Clients get read-only access to their monitoring data without needing a login.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/">
            <span className="text-gradient-tech font-extrabold text-xl">
              SerpAlert
            </span>
          </Link>
          <Link
            href="/sign-in"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-16 md:py-20 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-gray-500 max-w-lg mx-auto">
          One plan. Everything you need to protect your brand keywords.
        </p>
      </section>

      {/* Pricing Card */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Brand Monitoring
            </h2>
            <div className="mt-4 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-extrabold tracking-tight text-gray-900">
                £149
              </span>
              <span className="text-gray-500 text-sm font-medium">/month</span>
            </div>
            <span className="mt-3 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
              7-day free trial
            </span>
          </div>

          <ul className="mt-8 space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <Check className="h-5 w-5 shrink-0 text-indigo-600 mt-0.5" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 text-center">
            <Link
              href="/sign-up"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Start Free Trial
            </Link>
            <p className="mt-3 text-xs text-gray-400">
              No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Agency Partners */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-2xl text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
            Agency Partners
          </h2>
          <p className="mt-4 text-gray-500 max-w-lg mx-auto">
            Monitor all your clients&apos; brands from one account. Volume pricing that scales with you.
          </p>
        </div>

        <div className="mx-auto max-w-xl bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <table className="w-full text-sm mb-8">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left font-semibold text-gray-900 px-4 py-3 rounded-tl-lg">Brands</th>
                <th className="text-left font-semibold text-gray-900 px-4 py-3">Price</th>
                <th className="text-right font-semibold text-gray-900 px-4 py-3 rounded-tr-lg">Saving</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-3 text-gray-700">1 &ndash; 5</td>
                <td className="px-4 py-3 text-gray-900 font-semibold">&pound;109<span className="text-gray-500 font-normal">/brand/mo</span></td>
                <td className="px-4 py-3 text-right text-indigo-600 font-medium">27% off</td>
              </tr>
              <tr className="bg-indigo-50/30">
                <td className="px-4 py-3 text-gray-700">6 &ndash; 15</td>
                <td className="px-4 py-3 text-gray-900 font-semibold">&pound;89<span className="text-gray-500 font-normal">/brand/mo</span></td>
                <td className="px-4 py-3 text-right text-indigo-600 font-medium">40% off</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700">16+</td>
                <td className="px-4 py-3 text-gray-900 font-semibold">&pound;69<span className="text-gray-500 font-normal">/brand/mo</span></td>
                <td className="px-4 py-3 text-right text-indigo-600 font-medium">54% off</td>
              </tr>
            </tbody>
          </table>

          <ul className="space-y-3 mb-8">
            {agencyFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <Check className="h-5 w-5 shrink-0 text-indigo-600 mt-0.5" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="text-center">
            <a
              href="mailto:hello@serpalert.co.uk"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Get in Touch
            </a>
            <p className="mt-3 text-xs text-gray-400">
              We&apos;ll set up your agency account within 24 hours
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white border-t border-gray-200 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 text-center mb-10">
            Frequently asked questions
          </h2>
          <dl className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="text-sm font-semibold text-gray-900">
                  {faq.question}
                </dt>
                <dd className="mt-1 text-sm text-gray-500">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 px-6 py-8">
        <div className="mx-auto max-w-5xl flex items-center justify-center gap-6 text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-gray-600 transition-colors">
            Terms
          </Link>
        </div>
      </footer>
      <ExitIntentPopup />
    </div>
  );
}
