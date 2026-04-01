import Link from 'next/link'
import { getFunnelMetricsSummary, type FunnelWindowMetrics } from '@/lib/analytics/funnel'

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function renderWindow(window: FunnelWindowMetrics) {
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-xl font-semibold text-foreground">{window.windowDays}-Day Funnel</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {window.rangeStart.toISOString().slice(0, 10)} to {window.rangeEnd.toISOString().slice(0, 10)}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <MetricCard label="Visits" value={window.counts.visit} />
        <MetricCard label="Signup Starts" value={window.counts.signupStart} />
        <MetricCard label="Signups Complete" value={window.counts.signupComplete} />
        <MetricCard label="Trials Started" value={window.counts.trialStarted} />
        <MetricCard label="Checkout Started" value={window.counts.checkoutStarted} />
        <MetricCard label="Paid Conversions" value={window.counts.paidConversion} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Conversion Step</th>
              <th className="px-3 py-2 text-left font-medium">Rate</th>
            </tr>
          </thead>
          <tbody>
            <RateRow label="Visit → Signup Start" value={window.conversionRates.visitToSignupStart} />
            <RateRow label="Signup Start → Signup Complete" value={window.conversionRates.signupStartToSignupComplete} />
            <RateRow label="Signup Complete → Trial Start" value={window.conversionRates.signupCompleteToTrialStarted} />
            <RateRow label="Trial Start → Checkout Start" value={window.conversionRates.trialStartedToCheckoutStarted} />
            <RateRow label="Checkout Start → Paid Conversion" value={window.conversionRates.checkoutStartedToPaidConversion} />
            <RateRow label="Visit → Paid Conversion" value={window.conversionRates.visitToPaidConversion} />
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Audit Sub-Funnel</h3>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li>Checks Requested: {window.auditSubFunnel.auditCheckRequested}</li>
            <li>Reports Requested: {window.auditSubFunnel.auditReportRequested}</li>
            <li>Check → Report: {pct(window.auditSubFunnel.checkToReportRate)}</li>
            <li>Report → Signup Complete: {pct(window.auditSubFunnel.reportToSignupRate)}</li>
          </ul>
        </div>
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Calculator Sub-Funnel</h3>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li>Calculator Starts: {window.calculatorSubFunnel.calculatorStart}</li>
            <li>Calculator Completes: {window.calculatorSubFunnel.calculatorComplete}</li>
            <li>Start → Complete: {pct(window.calculatorSubFunnel.startToCompleteRate)}</li>
            <li>Complete → Signup Complete: {pct(window.calculatorSubFunnel.completeToSignupRate)}</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Paid Conversion Source</th>
              <th className="px-3 py-2 text-left font-medium">Medium</th>
              <th className="px-3 py-2 text-left font-medium">Campaign</th>
              <th className="px-3 py-2 text-left font-medium">Paid Conversions</th>
              <th className="px-3 py-2 text-left font-medium">Share</th>
            </tr>
          </thead>
          <tbody>
            {window.paidConversionAttribution.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-muted-foreground">
                  No paid conversions recorded in this window.
                </td>
              </tr>
            ) : (
              window.paidConversionAttribution.map((slice) => (
                <tr key={`${slice.source}:${slice.medium}:${slice.campaign}`} className="border-t border-border">
                  <td className="px-3 py-2">{slice.source}</td>
                  <td className="px-3 py-2">{slice.medium}</td>
                  <td className="px-3 py-2">{slice.campaign}</td>
                  <td className="px-3 py-2">{slice.paidConversions}</td>
                  <td className="px-3 py-2">{pct(slice.shareOfPaidConversions)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function RateRow({ label, value }: { label: string; value: number }) {
  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2">{label}</td>
      <td className="px-3 py-2">{pct(value)}</td>
    </tr>
  )
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const metrics = await getFunnelMetricsSummary()
  const { range } = await searchParams
  const selectedRange = range === '30' ? 30 : 7
  const selectableRanges = [
    { label: '7 Days', value: 7 as const, window: metrics.last7Days },
    { label: '30 Days', value: 30 as const, window: metrics.last30Days },
  ]
  const selectedWindow = selectedRange === 30 ? metrics.last30Days : metrics.last7Days
  const hasNoData = Object.values(selectedWindow.counts).every((count) => count === 0)

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Analytics Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Baseline funnel metrics from the internal analytics event stream.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date Range</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {selectableRanges.map((range) => (
            <Link
              key={range.value}
              href={`/admin/analytics?range=${range.value}`}
              className={`inline-flex rounded-md border px-3 py-1.5 text-sm ${
                range.value === selectedWindow.windowDays
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground'
              }`}
            >
              {range.label}
            </Link>
          ))}
        </div>
      </section>

      {hasNoData ? (
        <section className="rounded-lg border border-dashed border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">No analytics events in the selected window</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Data will appear here after tracked events are emitted from public pages and signup/billing flows.
          </p>
        </section>
      ) : null}

      {renderWindow(selectedWindow)}
    </div>
  )
}
