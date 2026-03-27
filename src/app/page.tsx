import Link from 'next/link'
import {
  Shield, TrendingDown, Bell, Plus, Search, Zap,
  Monitor, Camera, Users, FileText, MessageSquare, ExternalLink,
  CheckIcon,
} from 'lucide-react'
import { RoiCalculator } from '@/components/roi-calculator'

const PROBLEM_CARDS = [
  {
    num: '01',
    title: 'Competitors bid on your brand',
    description: 'Rivals target your brand keywords in Google Ads, siphoning clicks that should be yours and driving up your cost-per-click.',
    icon: Shield,
  },
  {
    num: '02',
    title: 'Your CPC rises, CTR drops',
    description: 'With more advertisers competing for your brand terms, you pay more per click while your click-through rate falls.',
    icon: TrendingDown,
  },
  {
    num: '03',
    title: 'SerpAlert detects & alerts',
    description: 'We monitor Google Ads multiple times daily and alert you the moment a competitor starts bidding on your brand keywords.',
    icon: Bell,
  },
]

const STEPS = [
  {
    title: 'Add your keywords',
    description: 'Enter your brand name and the terms people search to find you.',
    icon: Plus,
  },
  {
    title: 'We monitor 3x daily',
    description: 'Automated checks across Google Ads detect competitor activity fast.',
    icon: Search,
  },
  {
    title: 'Get instant alerts',
    description: 'Email and Slack notifications the moment a competitor appears.',
    icon: Zap,
  },
]

const FEATURES = [
  {
    title: 'Real-time Monitoring',
    description: 'Automated Google Ads checks multiple times per day so nothing slips through.',
    icon: Monitor,
  },
  {
    title: 'SERP Screenshots',
    description: 'Visual proof of competitor ads captured automatically for evidence and reporting.',
    icon: Camera,
  },
  {
    title: 'Competitor Tracking',
    description: 'See which competitors are bidding on your brand and how often they appear.',
    icon: Users,
  },
  {
    title: 'Evidence Packages',
    description: 'Auto-generated cease & desist letters with screenshots and timestamps.',
    icon: FileText,
  },
  {
    title: 'Slack Alerts',
    description: 'Instant notifications where your team already works. Email alerts included too.',
    icon: MessageSquare,
  },
  {
    title: 'Client Portal',
    description: 'White-label dashboards for agency clients to view brand bidding activity.',
    icon: ExternalLink,
  },
]

interface Plan {
  name: string
  price: string
  stripe: string
  popular?: boolean
  features: string[]
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    price: '£0',
    stripe: 'bg-muted-foreground',
    features: ['1 brand', '3 keywords', '3x/day checks', 'Email alerts'],
  },
  {
    name: 'Starter',
    price: '£29',
    stripe: 'bg-[oklch(50%_0.22_250)]',
    features: ['3 brands', '25 keywords', '3x/day checks', 'Email & Slack alerts', 'PDF reports'],
  },
  {
    name: 'Professional',
    price: '£79',
    stripe: 'bg-[oklch(52%_0.20_280)]',
    popular: true,
    features: ['10 brands', '100 keywords', '6x/day checks', 'Email & Slack alerts', 'SERP screenshots', 'Cease & desist generation'],
  },
  {
    name: 'Agency',
    price: '£199',
    stripe: 'bg-[oklch(62%_0.22_55)]',
    features: ['50 brands', '500 keywords', '12x/day checks', 'Email & Slack alerts', 'White-label portals', 'White-label PDF reports'],
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── 1. Navigation Bar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-gradient-tech font-extrabold text-lg tracking-tight">
            SerpAlert
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* ── 2. Hero Section ── */}
      <section className="bg-dot-pattern py-24 pt-38 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground max-w-3xl mx-auto leading-tight">
            Stop competitors stealing your brand clicks
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-6">
            SerpAlert monitors Google Ads for competitors bidding on your brand keywords and alerts you in minutes.
          </p>
          <Link
            href="/dashboard"
            className="neon-glow-cta bg-primary text-white px-8 py-3 rounded-lg font-semibold mt-8 inline-block"
          >
            Start Monitoring Free
          </Link>
        </div>
      </section>

      {/* ── 3. Social Proof Strip ── */}
      <section className="py-6 border-y border-border text-center">
        <p className="text-sm text-muted-foreground font-mono">
          Monitoring brand keywords across multiple brands
        </p>
      </section>

      {/* ── 4. Problem → Solution ── */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12">
            Why brands lose money on Google Ads
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROBLEM_CARDS.map((card) => (
              <div
                key={card.num}
                className="bg-card border border-border rounded-lg p-6 tech-card-hover relative"
              >
                <span className="text-4xl font-extrabold text-primary/10 block mb-4">
                  {card.num}
                </span>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                  <card.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. How It Works ── */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line on desktop */}
            <div className="hidden md:block absolute top-6 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-border" />
            {STEPS.map((step) => (
              <div key={step.title} className="flex flex-col items-center text-center relative">
                <div className="flex h-12 w-12 items-center justify-center bg-primary/10 text-primary rounded-full mb-4 z-10">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Features Grid ── */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12">
            Everything you need to protect your brand
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-card border border-border rounded-lg p-5 tech-card-hover"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                  <feature.icon className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Pricing ── */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12">
            Simple, transparent pricing
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`bg-card border border-border rounded-lg overflow-hidden flex flex-col ${
                  plan.popular ? 'ring-2 ring-primary/30 relative' : ''
                }`}
              >
                {/* Metric stripe */}
                <div className={`h-[3px] ${plan.stripe}`} />

                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-mono font-bold px-3 py-0.5 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-bold text-foreground">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold font-mono">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>

                  <ul className="mt-5 space-y-2.5 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckIcon className="h-4 w-4 shrink-0 mt-0.5 text-tech-green" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/dashboard"
                    className={`mt-6 inline-flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      plan.popular
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'border border-border bg-background hover:bg-muted'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. ROI Calculator ── */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12">
            Calculate your savings
          </h2>
          <div className="bg-card border border-border rounded-xl p-8">
            <RoiCalculator />
          </div>
        </div>
      </section>

      {/* ── 9. CTA Footer ── */}
      <section className="py-24 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-foreground">
            Protect your brand today
          </h2>
          <p className="text-muted-foreground mt-4">
            Start monitoring for free. No credit card required.
          </p>
          <Link
            href="/dashboard"
            className="neon-glow-cta bg-primary text-white px-8 py-3 rounded-lg font-semibold mt-8 inline-block"
          >
            Start Monitoring Free
          </Link>
          <p className="text-sm text-muted-foreground mt-6">
            Protected by SerpAlert
          </p>
        </div>
      </section>

    </div>
  )
}
