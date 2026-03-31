'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2 } from 'lucide-react'

interface Competitor {
  domain: string
  headline: string | null
  description: string | null
  position: number
}

type Step = 'input' | 'loading' | 'results' | 'revealed'

export default function AuditPage() {
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
        setError('Something went wrong. Please try again.')
        setStep('input')
        return
      }

      const data = await res.json()
      setCompetitors(data.competitors ?? [])
      setStep('results')
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
    } catch {
      setEmailError('Something went wrong. Please try again.')
    } finally {
      setEmailSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/" className="text-gradient-tech font-extrabold text-xl">
            SerpAlert
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

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
                        'Monitor This Keyword'
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

        {/* Step 4: Full reveal */}
        {step === 'revealed' && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-500 mb-4">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                Report sent
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
                Full report sent to <span className="text-primary">{email}</span>
              </h2>
              {competitors.length > 0 && (
                <p className="mt-3 text-muted-foreground">
                  {competitors.length} competitor{competitors.length !== 1 ? 's' : ''} found bidding on {keyword}
                </p>
              )}
            </div>

            {/* All competitors unblurred */}
            {competitors.map((c, i) => (
              <CompetitorCard key={i} competitor={c} blurred={false} />
            ))}

            {/* Upsell */}
            <div className="mt-10 bg-card border border-border rounded-lg p-8 text-center">
              <h3 className="text-xl font-bold text-foreground">
                Want real-time alerts when this changes?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                SerpAlert monitors your brand keywords every hour and alerts you the moment a competitor moves in.
              </p>
              <Link
                href="/sign-up"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Start 7-Day Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-xs text-muted-foreground">No credit card required</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CompetitorCard({ competitor, blurred }: { competitor: Competitor; blurred: boolean }) {
  return (
    <div
      className={`bg-card border border-border rounded-lg p-5 mb-3 ${blurred ? 'select-none' : ''}`}
      style={blurred ? { filter: 'blur(6px)', pointerEvents: 'none' } : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm font-semibold text-foreground">{competitor.domain}</span>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Position {competitor.position}
            </span>
          </div>
          {competitor.headline && (
            <p className="text-sm font-medium text-foreground truncate">{competitor.headline}</p>
          )}
          {competitor.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{competitor.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
