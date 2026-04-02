export const revalidate = 3600 // Revalidate every hour

import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "How SerpAlert collects, uses, and protects your data under UK GDPR.",
  path: "/privacy",
});

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <span>&larr;</span>
            <span>Back to home</span>
          </Link>
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Terms of Service
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8 md:p-12 space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Last updated: 31 March 2026
            </p>
          </div>

          <p className="text-gray-700 leading-relaxed">
            SerpAlert is operated by Seven Marketing. We take your privacy
            seriously and are committed to protecting your personal data. This
            policy explains what data we collect, how we use it, and your rights
            under the UK General Data Protection Regulation (UK GDPR).
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              1. What data we collect
            </h2>
            <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2">
              <li>
                <strong>Account information:</strong> your email address,
                collected and managed via Clerk (our authentication provider).
              </li>
              <li>
                <strong>Brand keywords:</strong> the brand terms you add for
                monitoring.
              </li>
              <li>
                <strong>Competitor ad data:</strong> information about ads
                appearing on Google search results for your monitored keywords,
                retrieved from Google SERPs.
              </li>
              <li>
                <strong>SERP screenshots:</strong> full-page screenshots of
                search results pages captured as evidence.
              </li>
              <li>
                <strong>Payment information:</strong> billing details processed
                securely by Stripe. We do not store your card details directly.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              2. How we use your data
            </h2>
            <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2">
              <li>
                Monitoring Google search results for competitor ads on your brand
                keywords.
              </li>
              <li>
                Sending you alerts via Slack when competitors are detected
                bidding on your brand terms.
              </li>
              <li>
                Generating reports and evidence packages for your review.
              </li>
              <li>Processing payments and managing your subscription.</li>
              <li>
                Improving and maintaining the SerpAlert service.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              3. Third-party services
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We use the following third-party services to operate SerpAlert:
            </p>
            <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2">
              <li>
                <strong>Clerk</strong> &mdash; authentication and user
                management.
              </li>
              <li>
                <strong>Stripe</strong> &mdash; payment processing and
                subscription management.
              </li>
              <li>
                <strong>Neon</strong> &mdash; PostgreSQL database hosting.
              </li>
              <li>
                <strong>Vercel</strong> &mdash; application hosting and
                deployment.
              </li>
              <li>
                <strong>SerpAPI</strong> &mdash; retrieving Google search result
                data.
              </li>
              <li>
                <strong>DataForSEO</strong> &mdash; capturing SERP screenshots.
              </li>
              <li>
                <strong>Vercel Blob</strong> &mdash; storing screenshot files.
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Each of these services has its own privacy policy. We encourage you
              to review them.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              4. Data retention
            </h2>
            <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2">
              <li>
                <strong>SERP check data</strong> (competitor ad records, keyword
                check results) is retained for <strong>90 days</strong>.
              </li>
              <li>
                <strong>Screenshots</strong> are automatically cleaned up after{" "}
                <strong>30 days</strong>.
              </li>
              <li>
                Account and billing data is retained for as long as your account
                is active, and for a reasonable period thereafter to comply with
                legal obligations.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              5. Your rights
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Under the UK GDPR, you have the following rights:
            </p>
            <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2">
              <li>
                <strong>Right of access:</strong> you can request a copy of the
                personal data we hold about you.
              </li>
              <li>
                <strong>Right to erasure:</strong> you can request that we delete
                your personal data.
              </li>
              <li>
                <strong>Right to data portability:</strong> you can request your
                data in a structured, machine-readable format.
              </li>
              <li>
                <strong>Right to rectification:</strong> you can request that we
                correct any inaccurate data.
              </li>
              <li>
                <strong>Right to object:</strong> you can object to processing of
                your personal data in certain circumstances.
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              To exercise any of these rights, contact us at the email address
              below.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">6. Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              SerpAlert uses essential cookies for authentication (Clerk) and
              first-party attribution cookies that store anonymous/session IDs,
              UTM parameters, and referrer data for up to 30 days. We use this
              data only to measure acquisition funnel performance and subscription
              conversion, not for third-party advertising.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">7. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this privacy policy or wish to exercise
              your data rights, please contact us:
            </p>
            <p className="text-gray-700">
              <strong>Seven Marketing</strong>
              <br />
              Email:{" "}
              <a
                href="mailto:chris@sevenmarketing.co.uk"
                className="text-indigo-600 hover:underline"
              >
                chris@sevenmarketing.co.uk
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
