'use client'

import { useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { PageViewTracker } from '@/components/analytics/page-view-tracker'
import { TrackedLink } from '@/components/analytics/tracked-link'
import { MarketingFooter } from '@/components/marketing-footer'
import { MarketingHeader } from '@/components/marketing-header'
import { emitClientAnalyticsEvent } from '@/lib/analytics/client'

interface Competitor {
  domain: string
  headline: string | null
  description: string | null
  position: number
}

type Step = 'input' | 'loading' | 'results' | 'revealed'

export default function AuditPageClient() {
  const [step, setStep] = useState<Step>('input')
  const [keyword, setKeyword] = useState('')
  const [email, setEmail] = useState('')
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailSubmitting, setEmailSubmitting] = useState(false)

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword.trim()) return
    setError('')
    setStep('loading')

    try {
      void emitClientAnalyticsEvent({
        name: 'cta_clicked',
        properties: {
          placement: 'audit_input_submit',
          ctaLabel: 'Check Now',
          funnelStage: 'audit_start',
          keywordLength: keyword.trim().length,
        },
      })

      void emitClientAnalyticsEvent({
        name: 'audit_check_requested',
        properties: { keywordLength: keyword.trim().length },
      })

      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim() }),
      })

      if (res.status === 429) {
        setError('Rate limit reached. You can run one free audit per hour.')
        setStep('input')
        return
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        const message = errorData.error ?? `Server error (${res.status}). Please try again.`
        setError(message)
        setStep('input')
        return
      }

      const data = await res.json()
      setCompetitors(data.competitors ?? [])
      setStep('results')

      void emitClientAnalyticsEvent({
        name: 'audit_result_viewed',
        properties: {
          keywordLength: keyword.trim().length,
          competitorCount: Array.isArray(data.competitors) ? data.competitors.length : 0,
        },
      })
    } catch {
      setError('Something went wrong. Please try again.')
      setStep('input')
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setEmailError('')
    setEmailSubmitting(true)

    try {
      void emitClientAnalyticsEvent({
        name: 'cta_clicked',
        properties: {
          placement: competitors.length > 0 ? 'audit_report_submit_competitor' : 'audit_report_submit_all_clear',
          ctaLabel: competitors.length > 0 ? 'Send My Full Report' : 'Send My Weekly Checks',
          funnelStage: 'audit_submit',
          competitorCount: competitors.length,
        },
      })

      const res = await fetch('/api/audit/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          keyword: keyword.trim(),
          competitorCount: competitors.length,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setEmailError(data.error ?? 'Something went wrong. Please try again.')
        setEmailSubmitting(false)
        return
      }

      setStep('revealed')

      void emitClientAnalyticsEvent({
        name: 'audit_report_requested',
        properties: {
          keywordLength: keyword.trim().length,
          competitorCount: competitors.length,
        },
      })
    } catch {
      setEmailError('Something went wrong. Please try again.')
    } finally {
      setEmailSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PageViewTracker properties={{ page: 'audit' }} />
      <MarketingHeader />

      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        {/* Step 1: Input */}
        {step === 'input' && (
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              Are Competitors Stealing Your Brand Clicks?
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Enter your brand keyword — we&apos;ll check Google right now. Free, no signup.
            </p>
            <form onSubmit={handleCheck} className="mt-10 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. your brand name"
                className="flex-1 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Check Now
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            {error && (
              <p className="mt-4 text-sm text-red-500">{error}</p>
            )}
          </div>
        )}

        {/* Step 2: Loading */}
        {step === 'loading' && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="h-3 w-3 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="h-3 w-3 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
            <p className="text-lg text-muted-foreground">
              Checking Google for <span className="font-semibold text-foreground">{keyword}</span>...
            </p>
          </div>
        )}

        {/* Step 3: Partial results */}
        {step === 'results' && (
          <div>
            {competitors.length > 0 ? (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
                    We found {competitors.length} competitor{competitors.length !== 1 ? 's' : ''} bidding on{' '}
                    <span className="text-red-500">{keyword}</span>
                  </h2>
                </div>

                {/* First competitor - fully visible */}
                <CompetitorCard competitor={competitors[0]} blurred={false} />

                {/* Remaining competitors - blurred */}
                {competitors.slice(1).map((c, i) => (
                  <CompetitorCard key={i} competitor={c} blurred />
                ))}

                {/* Email capture */}
                <div className="mt-8 bg-card border border-border rounded-lg p-6 text-center">
                  <p className="text-foreground font-semibold mb-1">
                    Want to see all {competitors.length} competitors?
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter your email for the full report + 8 weeks of free weekly monitoring.
                  </p>
                  <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                    <button
                      type="submit"
                      disabled={emailSubmitting}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {emailSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Send My Full Report'
                      )}
                    </button>
                  </form>
                  {emailError && (
                    <p className="mt-3 text-sm text-red-500">{emailError}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-500 mb-4">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                    All clear
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
                    Good news — no competitors are bidding on{' '}
                    <span className="text-emerald-500">{keyword}</span> right now
                  </h2>
                  <p className="mt-3 text-muted-foreground">
                    But this can change any time. Enter your email for weekly monitoring.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                    <button
                      type="submit"
                      disabled={emailSubmitting}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {emailSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Send My Weekly Checks'
                      )}
                    </button>
                  </form>
                  {emailError && (
                    <p className="mt-3 text-sm text-red-500">{emailError}</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4: Revealed */}
        {step === 'revealed' && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-500 mb-4">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                Report sent
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
                Full report sent to {email}
              </h2>
              <p className="mt-3 text-muted-foreground">
                You&apos;ll also get 8 weeks of free weekly monitoring for <strong>{keyword}</strong>.
              </p>
            </div>

            {competitors.map((c, i) => (
              <CompetitorCard key={i} competitor={c} blurred={false} />
            ))}

            <div className="mt-8 bg-card border border-border rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Want real-time alerts instead of weekly checks?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start your 7-day free trial and get hourly monitoring, screenshot evidence, and instant alerts.
              </p>
              <TrackedLink
                href="/sign-up"
                eventProperties={{
                  placement: 'audit_revealed_trial_cta',
                  ctaLabel: 'Start Free Trial',
                  funnelStage: 'signup_start',
                  competitorCount: competitors.length,
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </TrackedLink>
            </div>
          </div>
        )}
      </div>
      <MarketingFooter />
    </div>
  )
}

function CompetitorCard({
  competitor,
  blurred = false,
}: {
  competitor: Competitor
  blurred?: boolean
}) {
  return (
    <div
      className={`border border-border rounded-lg p-5 bg-card mb-4 relative overflow-hidden ${
        blurred ? 'blur-sm select-none pointer-events-none' : ''
      }`}
    >
      <div className="text-sm text-muted-foreground mb-2">
        Position {competitor.position} &middot; {competitor.domain}
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        {competitor.headline ?? 'Ad headline unavailable'}
      </h3>
      <p className="text-sm text-muted-foreground mt-1">
        {competitor.description ?? 'Ad description unavailable'}
      </p>
      {blurred && (
        <div className="absolute inset-0 bg-background/20" />
      )}
    </div>
  )
}
