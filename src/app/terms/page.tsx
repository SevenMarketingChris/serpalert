export const revalidate = 3600 // Revalidate every hour

import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Terms of Service",
  description:
    "Terms and conditions for using SerpAlert brand keyword monitoring.",
  path: "/terms",
});

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <span>&larr;</span>
            <span>Back to home</span>
          </Link>
          <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8 md:p-12 space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Terms of Service
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Last updated: 31 March 2026
            </p>
          </div>

          <p className="text-gray-700 leading-relaxed">
            These terms govern your use of SerpAlert, operated by Seven
            Marketing. By using SerpAlert, you agree to these terms.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              1. Service description
            </h2>
            <p className="text-gray-700 leading-relaxed">
              SerpAlert monitors Google search results for competitor ads
              appearing on your brand keywords. The service checks SERPs on an
              hourly basis, captures screenshots as evidence, and sends alerts
              when competitors are detected.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              2. Account terms
            </h2>
            <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2">
              <li>One account per person. Do not share your login credentials.</li>
              <li>
                You are responsible for maintaining the security of your account
                and credentials.
              </li>
              <li>
                You must provide accurate information when creating your account.
              </li>
              <li>
                You must be at least 18 years old to use SerpAlert.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">3. Billing</h2>
            <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2">
              <li>
                SerpAlert costs <strong>&pound;149 per month</strong>.
              </li>
              <li>
                New accounts receive a <strong>7-day free trial</strong>. No
                credit card is required to start your trial.
              </li>
              <li>
                You can cancel your subscription at any time via the Stripe
                customer portal.
              </li>
              <li>
                No refunds are provided for partial months. Your access
                continues until the end of the current billing period.
              </li>
              <li>
                All payments are processed securely by Stripe.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              4. Acceptable use
            </h2>
            <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2">
              <li>
                Do not abuse the manual check feature (e.g. excessive automated
                requests or scripted usage).
              </li>
              <li>
                Do not use SerpAlert for any illegal or unauthorised purpose.
              </li>
              <li>
                Do not attempt to reverse engineer, decompile, or disassemble
                any part of the service.
              </li>
              <li>
                Do not interfere with or disrupt the service or its
                infrastructure.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              5. Data accuracy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              SERP data is provided on an &ldquo;as-is&rdquo; basis. While we
              strive for accuracy, we do not guarantee 100% accuracy of ad
              detection. Search results can vary by location, device, and time,
              and Google may personalise results. SerpAlert should be used as one
              tool among others in your brand protection strategy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              6. Intellectual property
            </h2>
            <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2">
              <li>
                SerpAlert and its original content, features, and functionality
                are owned by Seven Marketing.
              </li>
              <li>
                You retain ownership of your data (keywords, settings, and any
                content you provide).
              </li>
              <li>
                You grant us a licence to use your data solely for the purpose of
                providing the SerpAlert service to you.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              7. Limitation of liability
            </h2>
            <p className="text-gray-700 leading-relaxed">
              To the maximum extent permitted by law, Seven Marketing shall not
              be liable for any indirect, incidental, special, consequential, or
              punitive damages, or any loss of profits or revenues, whether
              incurred directly or indirectly, or any loss of data, use,
              goodwill, or other intangible losses resulting from your use of
              SerpAlert.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our total liability for any claims arising from or related to your
              use of SerpAlert shall not exceed the total fees you have paid to
              us in the 12 months preceding the claim.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              8. Cease and desist letters
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Cease and desist letters generated by SerpAlert are templates only
              and do not constitute legal advice. You should consult a qualified
              solicitor before sending any cease and desist correspondence. Seven
              Marketing accepts no liability for the use or consequences of these
              templates.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              9. Termination
            </h2>
            <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2">
              <li>
                You can cancel your account at any time through the Stripe
                customer portal.
              </li>
              <li>
                We reserve the right to suspend or terminate your account if you
                violate these terms or engage in abusive behaviour.
              </li>
              <li>
                Upon termination, your data will be deleted in accordance with
                our data retention policy outlined in our{" "}
                <Link
                  href="/privacy"
                  className="text-indigo-600 hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              10. Governing law
            </h2>
            <p className="text-gray-700 leading-relaxed">
              These terms shall be governed by and construed in accordance with
              the laws of England and Wales. Any disputes arising from these
              terms shall be subject to the exclusive jurisdiction of the courts
              of England and Wales.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">11. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about these terms, please contact us:
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
