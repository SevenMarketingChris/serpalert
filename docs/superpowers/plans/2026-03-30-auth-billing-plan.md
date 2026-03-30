# Auth + Billing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Clerk auth (email + Google), Stripe billing (£149/mo with 7-day trial), and route protection to SerpAlert.

**Architecture:** Clerk handles auth externally (no users table). Stripe handles subscriptions via Checkout + webhooks. proxy.ts protects dashboard/admin routes. New columns on the existing brands table track subscription state.

**Tech Stack:** @clerk/nextjs, stripe (Node SDK), Next.js 16 proxy.ts, Drizzle ORM, Neon Postgres

---

## File Structure

### New Files
- `src/app/sign-in/[[...sign-in]]/page.tsx` — Clerk sign-in page
- `src/app/sign-up/[[...sign-up]]/page.tsx` — Clerk sign-up page
- `src/proxy.ts` — Next.js 16 route protection middleware
- `src/app/api/webhooks/stripe/route.ts` — Stripe webhook handler
- `src/app/api/stripe/checkout/route.ts` — Creates Stripe Checkout sessions
- `src/app/api/stripe/portal/route.ts` — Creates Stripe Customer Portal sessions
- `src/app/api/stripe/payment-link/route.ts` — Admin generates payment links for client brands
- `src/lib/stripe.ts` — Stripe client singleton

### Modified Files
- `src/lib/db/schema.ts` — Add billing columns to brands table
- `src/lib/db/queries.ts` — Update getAllActiveBrands, createBrandForUser, add billing queries
- `src/app/layout.tsx` — Wrap with ClerkProvider
- `src/app/page.tsx` — Update CTAs to sign-up/sign-in
- `src/app/dashboard/page.tsx` — Filter by userId, show trial/subscription banners
- `src/app/dashboard/new/actions.ts` — Set userId from Clerk, set trialEndsAt
- `src/app/dashboard/new/page.tsx` — Get userId from Clerk auth
- `src/app/admin/new-brand-form.tsx` — Add agency-managed toggle
- `src/app/admin/actions.ts` — Support agencyManaged flag
- `src/lib/env.ts` — Add Stripe env vars
- `package.json` — Add @clerk/nextjs, stripe

---

### Task 1: Install Dependencies & Add Schema Columns

**Files:**
- Modify: `package.json`
- Modify: `src/lib/db/schema.ts`

- [ ] **Step 1: Install Clerk and Stripe packages**

```bash
cd "/Users/chris/Claude Code/serpalert" && npm install @clerk/nextjs stripe
```

- [ ] **Step 2: Add billing columns to brands schema**

In `src/lib/db/schema.ts`, add these columns to the `brands` table definition, after the `plan` field (line 18):

```typescript
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  agencyManaged: boolean('agency_managed').notNull().default(false),
  trialEndsAt: timestamp('trial_ends_at'),
  subscriptionStatus: text('subscription_status').notNull().default('trialing'),
```

- [ ] **Step 3: Push schema to database**

```bash
cd "/Users/chris/Claude Code/serpalert" && npx dotenv -e .env.local -- npx drizzle-kit push
```

Expected: Schema changes applied, 5 new columns added to brands table.

- [ ] **Step 4: Commit**

```bash
cd "/Users/chris/Claude Code/serpalert" && git add package.json package-lock.json src/lib/db/schema.ts && git commit -m "feat: add Clerk + Stripe deps, billing columns to brands schema"
```

---

### Task 2: Stripe Client & Environment Setup

**Files:**
- Create: `src/lib/stripe.ts`
- Modify: `src/lib/env.ts`

- [ ] **Step 1: Create Stripe client singleton**

Create `src/lib/stripe.ts`:

```typescript
import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('Missing STRIPE_SECRET_KEY')
    _stripe = new Stripe(key, { apiVersion: '2025-12-18.acacia' })
  }
  return _stripe
}
```

- [ ] **Step 2: Add Stripe env vars to validation**

In `src/lib/env.ts`, add `'STRIPE_SECRET_KEY'` and `'STRIPE_WEBHOOK_SECRET'` to the `critical` array on line 13:

```typescript
  const critical = ['DATABASE_URL', 'DATAFORSEO_LOGIN', 'DATAFORSEO_PASSWORD', 'SERPAPI_KEY', 'ADMIN_SECRET', 'CRON_SECRET', 'BLOB_READ_WRITE_TOKEN', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] as const;
```

Add to the `getServerEnv()` return object:

```typescript
    stripeSecretKey: requireEnv("STRIPE_SECRET_KEY"),
    stripeWebhookSecret: requireEnv("STRIPE_WEBHOOK_SECRET"),
    stripePriceId: requireEnv("STRIPE_PRICE_ID"),
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/chris/Claude Code/serpalert" && git add src/lib/stripe.ts src/lib/env.ts && git commit -m "feat: add Stripe client singleton and env validation"
```

---

### Task 3: Clerk Auth Pages & Provider

**Files:**
- Create: `src/app/sign-in/[[...sign-in]]/page.tsx`
- Create: `src/app/sign-up/[[...sign-up]]/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create sign-in page**

Create `src/app/sign-in/[[...sign-in]]/page.tsx`:

```tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignIn afterSignInUrl="/dashboard" />
    </div>
  )
}
```

- [ ] **Step 2: Create sign-up page**

Create `src/app/sign-up/[[...sign-up]]/page.tsx`:

```tsx
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignUp afterSignUpUrl="/dashboard" />
    </div>
  )
}
```

- [ ] **Step 3: Wrap layout with ClerkProvider and add UserButton**

In `src/app/layout.tsx`, add the ClerkProvider import and wrap the body content:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SERP Alert",
  description: "Monitor competitor ad activity on Google Search",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        <body className="antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/chris/Claude Code/serpalert" && git add src/app/sign-in src/app/sign-up src/app/layout.tsx && git commit -m "feat: add Clerk auth pages and ClerkProvider"
```

---

### Task 4: Route Protection with proxy.ts

**Files:**
- Create: `src/proxy.ts`

- [ ] **Step 1: Create proxy.ts for route protection**

Create `src/proxy.ts`:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/admin(.*)'])
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.url)
      return NextResponse.redirect(signInUrl)
    }

    if (isAdminRoute(req)) {
      const { sessionClaims } = await auth()
      const role = (sessionClaims?.publicMetadata as { role?: string })?.role
      if (role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/chris/Claude Code/serpalert" && git add src/proxy.ts && git commit -m "feat: add proxy.ts for Clerk route protection"
```

---

### Task 5: Update Database Queries for Billing

**Files:**
- Modify: `src/lib/db/queries.ts`

- [ ] **Step 1: Update getAllActiveBrands to filter by subscription status**

Replace the `getAllActiveBrands` function (lines 22-24) with:

```typescript
export async function getAllActiveBrands(): Promise<Brand[]> {
  const allBrands = await db.select().from(brands).where(eq(brands.active, true))
  const now = new Date()
  return allBrands.filter(b => {
    if (b.agencyManaged) return true
    if (b.subscriptionStatus === 'active') return true
    if (b.subscriptionStatus === 'past_due') return true
    if (b.subscriptionStatus === 'agency') return true
    if (b.subscriptionStatus === 'trialing' && b.trialEndsAt && b.trialEndsAt > now) return true
    return false
  })
}
```

- [ ] **Step 2: Update createBrandForUser to set trial fields**

Replace the `createBrandForUser` function (lines 85-103) with:

```typescript
export async function createBrandForUser(
  data: { name: string; keywords: string[]; domain?: string },
  userId: string,
): Promise<Brand> {
  const slug = data.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 7)
  const rows = await db.insert(brands).values({
    name: data.name,
    slug,
    keywords: data.keywords,
    domain: data.domain,
    plan: 'free',
    userId,
    subscriptionStatus: 'trialing',
    trialEndsAt,
  }).returning()
  if (!rows[0]) throw new Error('Failed to create brand')
  return rows[0]
}
```

- [ ] **Step 3: Add billing update queries**

Add these functions to the end of `src/lib/db/queries.ts`:

```typescript
export async function updateBrandSubscription(
  brandId: string,
  data: {
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    subscriptionStatus?: string
  },
): Promise<void> {
  await db.update(brands)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(brands.id, brandId))
}

export async function getBrandByStripeSubscriptionId(subscriptionId: string): Promise<Brand | null> {
  const rows = await db.select().from(brands)
    .where(eq(brands.stripeSubscriptionId, subscriptionId))
    .limit(1)
  return rows[0] ?? null
}

export async function getBrandByStripeCustomerId(customerId: string): Promise<Brand | null> {
  const rows = await db.select().from(brands)
    .where(eq(brands.stripeCustomerId, customerId))
    .limit(1)
  return rows[0] ?? null
}
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/chris/Claude Code/serpalert" && git add src/lib/db/queries.ts && git commit -m "feat: update queries for billing — trial, subscription filtering, Stripe lookups"
```

---

### Task 6: Stripe Checkout & Portal API Routes

**Files:**
- Create: `src/app/api/stripe/checkout/route.ts`
- Create: `src/app/api/stripe/portal/route.ts`
- Create: `src/app/api/stripe/payment-link/route.ts`

- [ ] **Step 1: Create Checkout session endpoint**

Create `src/app/api/stripe/checkout/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStripe } from '@/lib/stripe'
import { getBrandById } from '@/lib/db/queries'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { brandId } = await request.json()
  if (!brandId) {
    return NextResponse.json({ error: 'brandId required' }, { status: 400 })
  }

  const brand = await getBrandById(brandId)
  if (!brand || brand.userId !== userId) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
  }

  const stripe = getStripe()
  const priceId = process.env.STRIPE_PRICE_ID
  if (!priceId) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const origin = new URL(request.url).origin

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { brandId, userId },
    success_url: `${origin}/dashboard?subscribed=true`,
    cancel_url: `${origin}/dashboard`,
    customer_email: undefined, // Clerk manages email separately
  })

  return NextResponse.json({ url: session.url })
}
```

- [ ] **Step 2: Create Customer Portal endpoint**

Create `src/app/api/stripe/portal/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStripe } from '@/lib/stripe'
import { getBrandById } from '@/lib/db/queries'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { brandId } = await request.json()
  const brand = await getBrandById(brandId)
  if (!brand || brand.userId !== userId || !brand.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
  }

  const stripe = getStripe()
  const origin = new URL(request.url).origin

  const session = await stripe.billingPortal.sessions.create({
    customer: brand.stripeCustomerId,
    return_url: `${origin}/dashboard/${brandId}`,
  })

  return NextResponse.json({ url: session.url })
}
```

- [ ] **Step 3: Create admin payment link endpoint**

Create `src/app/api/stripe/payment-link/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { getBrandById } from '@/lib/db/queries'

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { brandId } = await request.json()
  const brand = await getBrandById(brandId)
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
  }

  const stripe = getStripe()
  const priceId = process.env.STRIPE_PRICE_ID
  if (!priceId) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const origin = new URL(request.url).origin

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { brandId },
    success_url: `${origin}/client/${brand.clientToken}`,
    cancel_url: origin,
  })

  return NextResponse.json({ url: session.url })
}
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/chris/Claude Code/serpalert" && git add src/app/api/stripe && git commit -m "feat: add Stripe Checkout, Customer Portal, and payment link endpoints"
```

---

### Task 7: Stripe Webhook Handler

**Files:**
- Create: `src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Create webhook handler**

Create `src/app/api/webhooks/stripe/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { updateBrandSubscription, getBrandByStripeSubscriptionId } from '@/lib/db/queries'

export async function POST(request: Request) {
  const stripe = getStripe()
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const brandId = session.metadata?.brandId
      if (!brandId) {
        console.error('checkout.session.completed missing brandId metadata')
        break
      }

      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id

      const customerId = typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id

      await updateBrandSubscription(brandId, {
        stripeCustomerId: customerId ?? undefined,
        stripeSubscriptionId: subscriptionId ?? undefined,
        subscriptionStatus: 'active',
      })
      console.info(`Brand ${brandId} activated via Stripe checkout`)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object
      const brand = await getBrandByStripeSubscriptionId(subscription.id)
      if (!brand) {
        console.warn(`No brand found for subscription ${subscription.id}`)
        break
      }

      let status: string
      switch (subscription.status) {
        case 'active': status = 'active'; break
        case 'past_due': status = 'past_due'; break
        case 'canceled':
        case 'unpaid': status = 'canceled'; break
        default: status = subscription.status; break
      }

      await updateBrandSubscription(brand.id, { subscriptionStatus: status })
      console.info(`Brand ${brand.id} subscription updated to ${status}`)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      const brand = await getBrandByStripeSubscriptionId(subscription.id)
      if (!brand) break

      await updateBrandSubscription(brand.id, { subscriptionStatus: 'canceled' })
      console.info(`Brand ${brand.id} subscription canceled`)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const customerId = typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id
      if (!customerId) break

      // Find brand by customer ID and mark as past_due
      const { getBrandByStripeCustomerId } = await import('@/lib/db/queries')
      const brand = await getBrandByStripeCustomerId(customerId)
      if (!brand) break

      await updateBrandSubscription(brand.id, { subscriptionStatus: 'past_due' })
      console.info(`Brand ${brand.id} payment failed — marked past_due`)
      break
    }

    default:
      // Unhandled event type — ignore
      break
  }

  return NextResponse.json({ received: true })
}
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/chris/Claude Code/serpalert" && git add src/app/api/webhooks/stripe && git commit -m "feat: add Stripe webhook handler for subscription lifecycle"
```

---

### Task 8: Update Dashboard to Use Clerk Auth & Show Billing State

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/new/actions.ts`
- Modify: `src/app/dashboard/new/page.tsx`

- [ ] **Step 1: Update dashboard to filter by Clerk userId and show subscription banners**

Replace `src/app/dashboard/page.tsx` entirely:

```tsx
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { UserButton } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { getBrandsForUser, getLastCheckForBrand, getUserBrandCount, PLAN_LIMITS } from '@/lib/db/queries'
import type { Brand, SerpCheck } from '@/lib/db/schema'
import { ThemeToggle } from '@/components/theme-toggle'
import { getRelativeTime } from '@/lib/time'
import { SubscribeBanner } from '@/components/subscribe-banner'
import { SubscribeButton } from '@/components/subscribe-button'

const planColors: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  starter: 'bg-blue-500/10 text-blue-500',
  professional: 'bg-purple-500/10 text-purple-500',
  agency: 'bg-orange-500/10 text-orange-500',
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const brands: Brand[] = await getBrandsForUser(userId)
  const brandCount = await getUserBrandCount(userId)
  const canAddBrand = brandCount < PLAN_LIMITS.free.brands

  // Fetch last check for each brand
  const lastChecks = await Promise.all(
    brands.map(async (b) => {
      const check = await getLastCheckForBrand(b.id)
      return { brandId: b.id, check }
    })
  )
  const checkMap = new Map<string, SerpCheck | null>(
    lastChecks.map(({ brandId, check }) => [brandId, check])
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tight text-gradient-tech">SerpAlert</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-5xl space-y-6">
        {/* Subscription banners for brands that need attention */}
        {brands.map((b) => {
          if (b.agencyManaged || b.subscriptionStatus === 'active') return null
          return <SubscribeBanner key={`banner-${b.id}`} brand={b} />
        })}

        {brands.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-gradient-tech">Welcome to SerpAlert</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Start monitoring your brand keywords
              </p>
            </div>
            <Link
              href="/dashboard/new"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Create Your First Brand
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground font-mono">
                Your Brands
              </h2>
              {canAddBrand && (
                <Link
                  href="/dashboard/new"
                  className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  + Add Brand
                </Link>
              )}
            </div>

            {/* Summary bar */}
            <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                <span className="font-mono font-bold text-foreground">{brands.length}</span> brand{brands.length !== 1 ? 's' : ''}
              </span>
              <span className="text-border">·</span>
              <span className="text-muted-foreground">
                <span className="font-mono font-bold text-foreground">{brands.reduce((s, b) => s + b.keywords.length, 0)}</span> keywords
              </span>
            </div>

            {/* Brand grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((b) => {
                const lastCheck = checkMap.get(b.id)
                const hasThreat = lastCheck && lastCheck.competitorCount > 0
                const isExpired = b.subscriptionStatus === 'trialing' && b.trialEndsAt && b.trialEndsAt <= new Date()
                const isCanceled = b.subscriptionStatus === 'canceled'

                return (
                  <div key={b.id} className="relative">
                    <Link
                      href={`/dashboard/${b.id}`}
                      className={`block bg-card border border-border rounded-lg p-5 tech-card-hover ${(isExpired || isCanceled) ? 'opacity-60' : ''}`}
                    >
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg">{b.name}</h3>
                          <p className="font-mono text-sm text-muted-foreground">
                            {b.domain || 'No domain set'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {b.subscriptionStatus === 'active' && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono bg-emerald-500/10 text-emerald-600">
                              Active
                            </span>
                          )}
                          {b.subscriptionStatus === 'trialing' && !isExpired && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono bg-blue-500/10 text-blue-600">
                              Trial
                            </span>
                          )}
                          {isExpired && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono bg-red-500/10 text-red-600">
                              Expired
                            </span>
                          )}
                          {isCanceled && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono bg-red-500/10 text-red-600">
                              Canceled
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {b.keywords.length} keyword{b.keywords.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${hasThreat ? 'bg-red-500' : 'bg-emerald-500'}`}
                          />
                          {hasThreat ? (
                            <span className="text-muted-foreground">
                              {lastCheck.competitorCount} competitor{lastCheck.competitorCount !== 1 ? 's' : ''} detected
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Protected</span>
                          )}
                          {lastCheck && (
                            <span className="text-muted-foreground font-mono text-xs">
                              {getRelativeTime(lastCheck.checkedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                    {(isExpired || isCanceled) && (
                      <div className="absolute bottom-3 right-3">
                        <SubscribeButton brandId={b.id} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update dashboard/new/actions.ts to use Clerk userId**

Replace `src/app/dashboard/new/actions.ts`:

```typescript
'use server'

import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createBrandForUser, getUserBrandCount, PLAN_LIMITS } from '@/lib/db/queries'

export type CreateUserBrandState = {
  error?: string
} | null

export async function createBrand(
  _prev: CreateUserBrandState,
  formData: FormData,
): Promise<CreateUserBrandState> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  // Check brand limit
  const brandCount = await getUserBrandCount(userId)
  if (brandCount >= PLAN_LIMITS.free.brands) {
    return { error: `You can only create ${PLAN_LIMITS.free.brands} brand on the free plan` }
  }

  const name = ((formData.get('name') as string) ?? '').trim()
  if (!name) return { error: 'Brand name is required' }

  const domain = ((formData.get('domain') as string) ?? '').trim() || undefined
  const keywordsRaw = ((formData.get('keywords') as string) ?? '')
  const keywords = keywordsRaw
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)
    .slice(0, PLAN_LIMITS.free.keywords)

  try {
    await createBrandForUser({ name, domain, keywords }, userId)
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return { error: 'A brand with that name already exists' }
    }
    console.error('Brand creation failed:', err)
    return { error: 'Failed to create brand' }
  }

  redirect('/dashboard')
}
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/chris/Claude Code/serpalert" && git add src/app/dashboard && git commit -m "feat: dashboard uses Clerk auth, shows subscription state, enforces plan limits"
```

---

### Task 9: Subscribe Banner & Button Components

**Files:**
- Create: `src/components/subscribe-banner.tsx`
- Create: `src/components/subscribe-button.tsx`

- [ ] **Step 1: Create SubscribeBanner component**

Create `src/components/subscribe-banner.tsx`:

```tsx
import type { Brand } from '@/lib/db/schema'
import { SubscribeButton } from './subscribe-button'

export function SubscribeBanner({ brand }: { brand: Brand }) {
  const isExpired = brand.subscriptionStatus === 'trialing' && brand.trialEndsAt && brand.trialEndsAt <= new Date()
  const isCanceled = brand.subscriptionStatus === 'canceled'
  const isTrialing = brand.subscriptionStatus === 'trialing' && brand.trialEndsAt && brand.trialEndsAt > new Date()

  if (isCanceled) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-red-600">Subscription canceled for {brand.name}</p>
          <p className="text-xs text-red-600/80">Monitoring is paused. Subscribe to resume.</p>
        </div>
        <SubscribeButton brandId={brand.id} />
      </div>
    )
  }

  if (isExpired) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-red-600">Trial expired for {brand.name}</p>
          <p className="text-xs text-red-600/80">Your monitoring is paused. Subscribe to resume.</p>
        </div>
        <SubscribeButton brandId={brand.id} />
      </div>
    )
  }

  if (isTrialing) {
    const daysLeft = Math.ceil((brand.trialEndsAt!.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-600">
            {daysLeft} day{daysLeft !== 1 ? 's' : ''} left in your trial for {brand.name}
          </p>
          <p className="text-xs text-amber-600/80">Subscribe to keep monitoring after your trial ends.</p>
        </div>
        <SubscribeButton brandId={brand.id} />
      </div>
    )
  }

  return null
}
```

- [ ] **Step 2: Create SubscribeButton component**

Create `src/components/subscribe-button.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function SubscribeButton({ brandId }: { brandId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Failed to create checkout session:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSubscribe}
      disabled={loading}
      size="sm"
      className="bg-primary text-primary-foreground"
    >
      {loading ? 'Loading…' : 'Subscribe — £149/mo'}
    </Button>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/chris/Claude Code/serpalert" && git add src/components/subscribe-banner.tsx src/components/subscribe-button.tsx && git commit -m "feat: add SubscribeBanner and SubscribeButton components"
```

---

### Task 10: Update Homepage CTAs

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update homepage nav and hero CTA**

In `src/app/page.tsx`, update the nav section (lines 18-30) to add sign-in/sign-up links:

Replace the nav `<Link>` to Dashboard with:

```tsx
          <div className="flex items-center gap-4">
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
```

Find the main CTA button in the hero section that links to `/dashboard` and change it to link to `/sign-up` with text "Start Your Free Trial".

- [ ] **Step 2: Commit**

```bash
cd "/Users/chris/Claude Code/serpalert" && git add src/app/page.tsx && git commit -m "feat: update homepage CTAs to sign-up/sign-in"
```

---

### Task 11: Update Admin Panel for Agency-Managed Toggle

**Files:**
- Modify: `src/app/admin/new-brand-form.tsx`
- Modify: `src/app/admin/actions.ts`
- Modify: `src/lib/db/queries.ts` (createBrand function)

- [ ] **Step 1: Add agencyManaged checkbox to admin brand form**

In `src/app/admin/new-brand-form.tsx`, add this checkbox field after the Slack Webhook field (before the submit button, around line 96):

```tsx
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="agencyManaged"
              name="agencyManaged"
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="agencyManaged" className="font-normal">
              Agency managed <span className="text-muted-foreground">(always active, no Stripe subscription needed)</span>
            </Label>
          </div>
```

- [ ] **Step 2: Update admin createBrandAction to handle agencyManaged**

In `src/app/admin/actions.ts`, add after line 21 (after `roasRaw`):

```typescript
  const agencyManaged = formData.get('agencyManaged') === 'on'
```

And update the `createBrand` call to include the new fields:

```typescript
    const brand = await createBrand({
      name,
      slug,
      keywords,
      domain,
      googleAdsCustomerId: customerId,
      slackWebhookUrl: slack,
      monthlyBrandSpend: spendRaw,
      brandRoas: roasRaw,
      agencyManaged,
      subscriptionStatus: agencyManaged ? 'agency' : 'trialing',
    })
```

- [ ] **Step 3: Update createBrand query to accept new fields**

In `src/lib/db/queries.ts`, update the `createBrand` function signature (around line 351) to accept the new fields:

```typescript
export async function createBrand(data: {
  name: string; slug: string; keywords: string[]
  domain?: string
  googleAdsCustomerId?: string; slackWebhookUrl?: string
  monthlyBrandSpend?: string; brandRoas?: string
  agencyManaged?: boolean; subscriptionStatus?: string
}): Promise<Brand> {
  const rows = await db.insert(brands).values(data).returning()
  if (!rows[0]) throw new Error('Failed to create brand')
  return rows[0]
}
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/chris/Claude Code/serpalert" && git add src/app/admin/new-brand-form.tsx src/app/admin/actions.ts src/lib/db/queries.ts && git commit -m "feat: admin panel supports agency-managed brands"
```

---

### Task 12: Build & Test Locally

- [ ] **Step 1: Run TypeScript check**

```bash
cd "/Users/chris/Claude Code/serpalert" && npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 2: Run existing tests**

```bash
cd "/Users/chris/Claude Code/serpalert" && npm run test:run
```

Expected: All 23 existing tests pass.

- [ ] **Step 3: Run build**

```bash
cd "/Users/chris/Claude Code/serpalert" && npm run build
```

Expected: Build succeeds. There may be warnings about missing Clerk env vars locally, but the build should complete.

- [ ] **Step 4: Commit any fixes**

If any issues were found, fix and commit:

```bash
cd "/Users/chris/Claude Code/serpalert" && git add -A && git commit -m "fix: resolve build issues for auth + billing"
```

---

### Task 13: Update Existing Brands & Final Migration

- [ ] **Step 1: Set existing brands to agency-managed**

The 3 existing brands (Tide, Wisdom Panel, Morplan) need to be set as agency-managed so they continue working. Run via drizzle or a one-time script:

```bash
cd "/Users/chris/Claude Code/serpalert" && npx dotenv -e .env.local -- npx tsx -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
await sql\`UPDATE brands SET agency_managed = true, subscription_status = 'agency' WHERE active = true\`;
console.log('Updated existing brands to agency-managed');
"
```

- [ ] **Step 2: Verify brands are still active**

```bash
cd "/Users/chris/Claude Code/serpalert" && npx dotenv -e .env.local -- npx tsx -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
const rows = await sql\`SELECT name, agency_managed, subscription_status FROM brands WHERE active = true\`;
console.table(rows);
"
```

Expected: All 3 brands show `agency_managed: true`, `subscription_status: 'agency'`.

---

## Post-Implementation Setup Checklist

These are manual setup steps that must be done by the user (Chris) — not code tasks:

1. **Install Clerk via Vercel Marketplace**: `vercel integration add clerk` — this auto-provisions `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
2. **Set Clerk env vars manually**: `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
3. **Enable Google OAuth in Clerk Dashboard**: Clerk Dashboard → User & Authentication → Social Connections → Enable Google
4. **Set admin role in Clerk**: After signing up, go to Clerk Dashboard → Users → your user → Public Metadata → set `{"role": "admin"}`
5. **Create Stripe product**: In Stripe Dashboard, create product "SerpAlert Brand Monitoring" with price £149/mo (GBP recurring)
6. **Copy Stripe Price ID**: Set as `STRIPE_PRICE_ID` env var in Vercel
7. **Set Stripe keys**: `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` from Stripe Dashboard
8. **Create Stripe webhook**: In Stripe Dashboard → Developers → Webhooks → Add endpoint: `https://serpalert.co.uk/api/webhooks/stripe` — subscribe to: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
9. **Copy webhook signing secret**: Set as `STRIPE_WEBHOOK_SECRET` env var in Vercel
10. **Configure Stripe Customer Portal**: Stripe Dashboard → Settings → Customer Portal → Enable, configure cancellation policy
11. **Pull env vars locally**: `vercel env pull .env.local`
12. **Deploy**: `git push` — Vercel auto-deploys
