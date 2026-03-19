import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { RoiCalculator } from '@/components/roi-calculator'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ZapIcon, ShieldCheckIcon, TrendingDownIcon, BellIcon,
  CameraIcon, UsersIcon, CheckIcon, XIcon, ArrowRightIcon,
  BarChart2Icon, ClockIcon, AlertTriangleIcon, FileTextIcon,
  EyeIcon, SearchIcon, ChevronDownIcon,
} from 'lucide-react'

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#calculator', label: 'ROI Calculator' },
  { href: '#faq', label: 'FAQ' },
]

const SOCIAL_PROOF = [
  { label: 'Avg. Annual Savings', value: '£2,400' },
  { label: 'Brands Protected', value: '500+' },
  { label: 'Monitoring', value: '24/7' },
  { label: 'Alert Speed', value: '<4hr' },
]

const PROBLEM_STATS = [
  {
    range: '£500–£5,000', unit: 'per month',
    desc: 'Most companies spend this on bidding on their own brand name in Google Ads.',
    icon: TrendingDownIcon, color: 'orange',
  },
  {
    range: '60%', unit: 'of the time',
    desc: 'No competitors are even bidding against you. That\'s money straight down the drain.',
    icon: BarChart2Icon, color: 'blue',
  },
  {
    range: '£28,800', unit: 'wasted per year',
    desc: 'The average brand wastes this much on unnecessary brand PPC spend. Every year.',
    icon: AlertTriangleIcon, color: 'purple',
  },
]

const STEPS = [
  {
    n: '1', title: 'Add your brand keywords',
    desc: 'Enter your brand name and the terms people search to find you. We check Google Ads 3× daily for competitor activity.',
  },
  {
    n: '2', title: 'Get instant alerts',
    desc: 'The moment a competitor starts bidding on your brand, you\'ll know. Email, Slack, or both — you choose.',
  },
  {
    n: '3', title: 'Save money',
    desc: 'When no one\'s bidding against you, pause your brand PPC and keep the budget. We\'ll tell you when to turn it back on.',
  },
  {
    n: '4', title: 'Protect your trademark',
    desc: 'If a competitor uses your brand in their ad copy, we auto-generate a cease & desist letter ready to send.',
  },
]

const FEATURES = [
  {
    icon: EyeIcon, title: 'Real-time Competitor Detection',
    desc: 'Know within hours when a competitor starts bidding on your brand. We check Google Ads multiple times daily so nothing slips through.',
  },
  {
    icon: TrendingDownIcon, title: 'Smart Cost Savings',
    desc: 'See exactly how much you could save by pausing brand campaigns when no competitors are bidding. Track your savings over time.',
  },
  {
    icon: ShieldCheckIcon, title: 'Trademark Protection',
    desc: 'Auto-generated cease & desist notices when competitors use your brand name in their ad copy. Protect your trademark without expensive lawyers.',
  },
  {
    icon: CameraIcon, title: 'SERP Screenshots',
    desc: 'Visual proof of competitor ads captured automatically. Build an evidence file for legal action or internal reporting.',
  },
  {
    icon: UsersIcon, title: 'Client Portals',
    desc: 'White-label dashboards for your agency clients. Let them see brand bidding activity and savings in their own branded portal.',
  },
  {
    icon: BellIcon, title: 'Slack & Email Alerts',
    desc: 'Instant notifications where your team already works. Get alerted the moment a competitor starts — or stops — bidding on your brand.',
  },
]

type Feature = string
interface PlanDef {
  name: string
  price: string
  subtitle: string
  popular?: boolean
  cta: string
  features: (Feature | { text: string; disabled: boolean })[]
}

const PLANS: PlanDef[] = [
  {
    name: 'Free', price: '£0', subtitle: 'Try brand bidding monitoring', cta: 'Get Started Free',
    features: [
      '1 brand', '5 keywords', 'Daily checks', 'Email alerts', 'Savings tracker',
      { text: 'Cease & desist generation', disabled: true },
      { text: 'Slack alerts', disabled: true },
      { text: 'PDF reports', disabled: true },
    ],
  },
  {
    name: 'Starter', price: '£29', subtitle: 'For businesses protecting their brand', cta: 'Start Free Trial',
    features: [
      '3 brands', '25 keywords per brand', '3× daily checks', 'Email & Slack alerts',
      'Savings tracker', 'PDF reports', 'Cease & desist generation',
      { text: 'White-label portals', disabled: true },
    ],
  },
  {
    name: 'Professional', price: '£79', subtitle: 'Full protection with legal tools', popular: true, cta: 'Start Free Trial',
    features: [
      '10 brands', '100 keywords per brand', '6× daily checks', 'Email & Slack alerts',
      'Savings tracker', 'PDF reports', 'AI cease & desist generation', 'SERP screenshots',
    ],
  },
  {
    name: 'Agency', price: '£199', subtitle: 'White-label for client management', cta: 'Start Free Trial',
    features: [
      '50 brands', '500 keywords per brand', '12× daily checks', 'Email & Slack alerts',
      'Savings tracker', 'White-label PDF reports', 'AI cease & desist generation', 'White-label client portals',
    ],
  },
]

const FAQS = [
  {
    q: 'How does SerpAlert detect competitor bidding?',
    a: 'We run automated Google Ads searches for your brand keywords multiple times per day. When a competitor\'s ad appears in the results, we capture a screenshot and send you an alert — usually within a few hours.',
  },
  {
    q: 'Is it legal for competitors to bid on my brand name?',
    a: 'Bidding on your brand name as a keyword is generally legal. However, using your trademarked brand name in their ad copy (headlines or descriptions) can be a trademark violation. SerpAlert monitors for both and helps you take action when ad copy violations occur.',
  },
  {
    q: "What's a cease & desist notice?",
    a: 'A cease & desist is a formal letter demanding a competitor stop using your trademarked brand name in their ad copy. Our AI generates a professional template based on the evidence we\'ve captured — you review it and send it. No solicitor needed for the initial letter.',
  },
  {
    q: 'How much can I actually save?',
    a: 'Industry data shows that brand keywords are competitor-free around 60% of the time. If you\'re spending £2,000/month on brand PPC, that\'s up to £1,200/month you could pause and redirect. Use our ROI calculator above to see your specific numbers.',
  },
  {
    q: 'How often do you check for competitor ads?',
    a: 'Free plans get daily checks. Starter runs 3× per day, Professional 6×, and Agency 12× per day. Most brand bidding activity is caught within a few hours on paid plans.',
  },
  {
    q: 'Can I use this for my agency clients?',
    a: 'Yes — the Agency plan includes white-label client portals. Your clients get a branded dashboard showing their brand bidding activity, competitor alerts, and savings. You can also generate white-label PDF reports for client meetings.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <ZapIcon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-base font-black tracking-tight text-gradient-tech">SerpAlert</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">Login</Link>
            <Link href="/login" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Start Free <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-dot-pattern relative overflow-hidden border-b border-border">
        <div className="container mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-mono text-primary">
                <span className="status-dot-active" />
                Live brand monitoring
              </div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Stop Wasting Money<br />
                <span className="text-gradient-tech">on Brand PPC</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                SerpAlert monitors your brand keywords 24/7. When competitors stop bidding, you stop paying. When they use your brand in their ads, we draft the cease &amp; desist.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/login" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                  Start Protecting Your Brand <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link href="#how-it-works" className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-5 text-sm font-medium hover:bg-muted transition-colors">
                  See How It Works
                </Link>
              </div>
            </div>
            {/* Mock dashboard */}
            <div className="relative">
              <Card className="shadow-xl border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Brands Protected', value: '12', stripe: 'metric-stripe-blue', text: 'text-tech-blue' },
                      { label: 'Active Bidders', value: '3', stripe: 'metric-stripe-orange', text: 'text-tech-orange' },
                      { label: 'Saved This Month', value: '£2,400', stripe: 'metric-stripe-green', text: 'text-tech-green' },
                      { label: 'C&D Letters Sent', value: '7', stripe: 'metric-stripe-purple', text: 'text-tech-purple' },
                    ].map(({ label, value, stripe, text }) => (
                      <div key={label} className={`${stripe} rounded-lg bg-muted/40 p-3`}>
                        <p className="text-xs text-muted-foreground font-mono">{label}</p>
                        <p className={`text-xl font-black ${text} mt-0.5`}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3 space-y-2">
                    <p className="text-xs font-semibold font-mono uppercase tracking-wider text-muted-foreground">Recent Alerts</p>
                    {[
                      { msg: 'CompetitorX started bidding on "your brand"', ago: '2h ago', warn: true },
                      { msg: 'No competitors bidding — safe to pause brand PPC', ago: '1d ago', warn: false },
                      { msg: 'Trademark violation detected in ad copy', ago: '3d ago', warn: true },
                    ].map(({ msg, ago, warn }) => (
                      <div key={msg} className="flex items-start justify-between gap-2 text-xs">
                        <div className="flex items-start gap-2">
                          <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: warn ? 'oklch(62% 0.22 55)' : 'oklch(52% 0.20 145)' }} />
                          <span className="text-foreground">{msg}</span>
                        </div>
                        <span className="text-muted-foreground whitespace-nowrap font-mono">{ago}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof bar ── */}
      <section className="border-b border-border bg-muted/30">
        <div className="container mx-auto max-w-6xl px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {SOCIAL_PROOF.map(({ label, value }) => (
              <div key={label}>
                <p className="text-3xl font-black text-gradient-tech">{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem section ── */}
      <section className="border-b border-border">
        <div className="container mx-auto max-w-6xl px-6 py-20">
          <div className="text-center space-y-3 mb-12">
            <p className="text-xs uppercase tracking-widest text-primary font-mono">The Problem</p>
            <h2 className="text-3xl font-black tracking-tight">The Brand Bidding Tax</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">You&apos;re probably paying it right now — and you don&apos;t even know it.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PROBLEM_STATS.map(({ range, unit, desc, icon: Icon, color }) => (
              <Card key={range} className={`metric-stripe-${color} tech-card-hover border-border`}>
                <CardContent className="p-6 space-y-3">
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-tech-${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`text-3xl font-black text-tech-${color}`}>{range}</p>
                    <p className="text-sm font-medium text-muted-foreground">{unit}</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="border-b border-border bg-muted/20">
        <div className="container mx-auto max-w-6xl px-6 py-20">
          <div className="text-center space-y-3 mb-12">
            <p className="text-xs uppercase tracking-widest text-primary font-mono">Process</p>
            <h2 className="text-3xl font-black tracking-tight">How it works</h2>
            <p className="text-muted-foreground">Set up in 2 minutes. Start saving money on day one.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="relative space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-sm font-black text-primary font-mono">{n}</span>
                </div>
                <h3 className="font-semibold text-base">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="border-b border-border">
        <div className="container mx-auto max-w-6xl px-6 py-20">
          <div className="text-center space-y-3 mb-12">
            <p className="text-xs uppercase tracking-widest text-primary font-mono">Features</p>
            <h2 className="text-3xl font-black tracking-tight">Everything you need to protect your brand</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">From real-time detection to legal protection, SerpAlert gives you full control over your brand in Google Ads.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="tech-card-hover border-border">
                <CardContent className="p-6 space-y-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROI Calculator ── */}
      <section id="calculator" className="border-b border-border bg-muted/20">
        <div className="container mx-auto max-w-6xl px-6 py-20">
          <div className="text-center space-y-3 mb-12">
            <p className="text-xs uppercase tracking-widest text-primary font-mono">ROI Calculator</p>
            <h2 className="text-3xl font-black tracking-tight">How much could you save?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Enter your actual numbers to see your true net saving — including revenue impact and subscription cost.</p>
          </div>
          <RoiCalculator />
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-b border-border">
        <div className="container mx-auto max-w-6xl px-6 py-20">
          <div className="text-center space-y-3 mb-12">
            <p className="text-xs uppercase tracking-widest text-primary font-mono">Pricing</p>
            <h2 className="text-3xl font-black tracking-tight">Pays for itself in week one</h2>
            <p className="text-muted-foreground">Start free. Upgrade when you see the savings. All paid plans include a 14-day free trial.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLANS.map(plan => (
              <Card key={plan.name} className={`border-border relative flex flex-col ${plan.popular ? 'ring-2 ring-primary shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="font-mono text-xs tracking-widest bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6 flex flex-col flex-1 space-y-5">
                  <div>
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{plan.subtitle}</p>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-gradient-tech">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">/mo</span>
                    </div>
                  </div>
                  <ul className="space-y-2 flex-1">
                    {plan.features.map(f => {
                      const text = typeof f === 'string' ? f : f.text
                      const disabled = typeof f === 'string' ? false : f.disabled
                      return (
                        <li key={text} className={`flex items-start gap-2 text-sm ${disabled ? 'text-muted-foreground/50' : 'text-foreground'}`}>
                          {disabled
                            ? <XIcon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/40" />
                            : <CheckIcon className="h-4 w-4 shrink-0 mt-0.5 text-tech-green" />
                          }
                          {text}
                        </li>
                      )
                    })}
                  </ul>
                  <Link
                    href="/login"
                    className={`inline-flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      plan.popular
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'border border-border bg-background hover:bg-muted'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="border-b border-border bg-muted/20">
        <div className="container mx-auto max-w-3xl px-6 py-20">
          <div className="text-center space-y-3 mb-12">
            <p className="text-xs uppercase tracking-widest text-primary font-mono">FAQ</p>
            <h2 className="text-3xl font-black tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="space-y-2">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group rounded-xl border border-border bg-background overflow-hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium list-none hover:bg-muted/50 transition-colors">
                  {q}
                  <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="border-b border-border">
        <div className="container mx-auto max-w-3xl px-6 py-20 text-center space-y-6">
          <p className="text-xs uppercase tracking-widest text-primary font-mono">Get Started</p>
          <h2 className="text-3xl font-black tracking-tight">Start Saving on Brand PPC Today</h2>
          <p className="text-muted-foreground">Join 500+ brands already saving money with SerpAlert. Free to start, no credit card required.</p>
          <Link href="/login" className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Start Protecting Your Brand <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-muted/30">
        <div className="container mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
              <ZapIcon className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-black text-gradient-tech">SerpAlert</span>
          </div>
          <nav className="flex items-center gap-5">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
            ))}
            <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Login</Link>
          </nav>
          <p className="text-xs text-muted-foreground">Built by <span className="font-medium text-foreground">Seven Marketing</span></p>
        </div>
      </footer>

    </div>
  )
}
