# SerpAlert Auth + Billing Design Spec

## Goal

Add self-service signup (Clerk), subscription billing (Stripe £149/mo with 7-day free trial), and route protection so that anyone can sign up, monitor a brand, and pay — while the admin can also create agency-managed brands or generate payment links for clients.

## Architecture

**Clerk** handles authentication (signup, login, sessions, user management).
**Stripe** handles billing (subscriptions, checkout, customer portal).
**proxy.ts** (Next.js 16) protects routes based on auth state.

No users table — Clerk manages user data externally. The existing `userId` field on the `brands` table links to Clerk's user ID.

## User Flows

### Self-Service Signup

```
Homepage → "Get Started" → /sign-up (Clerk: email + Google)
→ Redirect to /dashboard → Empty state: "Add your first brand"
→ /dashboard/new → Add brand (1 brand, 3 keywords max on free plan)
→ 7-day trial starts (trialEndsAt set to now + 7 days)
→ Monitoring runs immediately (cron picks up the brand)
→ Day 5: Banner in dashboard "2 days left — subscribe to keep monitoring"
→ "Subscribe" button → Stripe Checkout (£149/mo, no trial on Stripe side — we track trial ourselves)
→ Webhook: checkout.session.completed → set subscriptionStatus to 'active'
→ OR trial expires → Soft lock: can view historical data, checks stop running
→ "Subscribe" banner persists on soft-locked dashboard
```

### Agency-Managed Brand (Admin)

```
Admin panel → Create brand → Toggle "Agency managed" checkbox
→ Brand is always active, no Stripe subscription needed
→ subscriptionStatus = 'agency'
```

### Client-Billed Brand (Admin)

```
Admin panel → Create brand → Leave "Agency managed" unchecked
→ Admin clicks "Generate payment link" → Stripe Checkout link created
→ Admin sends link to client (email/Slack)
→ Client pays → Webhook activates brand → subscriptionStatus = 'active'
```

### Sign In

```
/sign-in (Clerk: email + password, or Google OAuth)
→ Redirect to /dashboard
→ Dashboard shows only brands where userId matches Clerk user ID
```

## Sign-In Methods

- Email + password (standard)
- Google OAuth (one-click)
- Forgot password flow (built-in via Clerk)
- Additional providers (GitHub, Microsoft) can be enabled later in Clerk dashboard without code changes

## Route Protection

| Route | Access | Method |
|-------|--------|--------|
| `/` | Public | No auth |
| `/sign-in`, `/sign-up` | Public | Clerk components |
| `/dashboard/*` | Authenticated | Clerk middleware in proxy.ts |
| `/admin/*` | Authenticated + admin | Clerk middleware + admin check |
| `/client/[token]/*` | Public | Token-based (unchanged) |
| `/evidence/*` | Public | Token-based (unchanged) |
| `/api/webhooks/stripe` | Public | Stripe signature verification |
| `/api/cron/*` | CRON_SECRET header | Unchanged |
| `/api/brands/*` | Authenticated | Clerk auth check |

### proxy.ts Logic

```
if path starts with /dashboard or /admin:
  require Clerk auth (redirect to /sign-in if not authenticated)
if path starts with /admin:
  additionally require admin role (redirect to /unauthorized if not admin)
all other routes: pass through
```

Admin is determined by Clerk user metadata. Set via Clerk dashboard or API: `publicMetadata.role = 'admin'`.

## Database Changes

### Modified: `brands` table

Add columns:
- `stripeCustomerId: text` — Stripe customer ID, null for agency-managed
- `stripeSubscriptionId: text` — Stripe subscription ID
- `agencyManaged: boolean, default false` — if true, brand is always active regardless of payment
- `trialEndsAt: timestamp` — set to now + 7 days on self-service brand creation, null for admin-created
- `subscriptionStatus: text, default 'trialing'` — one of: `trialing`, `active`, `past_due`, `canceled`, `agency`

No new tables needed. Clerk manages users externally.

### Brand Active Logic

A brand should be included in cron checks if:
```
brand.active = true
AND (
  brand.agencyManaged = true
  OR brand.subscriptionStatus = 'active'
  OR (brand.subscriptionStatus = 'trialing' AND brand.trialEndsAt > now())
  OR brand.subscriptionStatus = 'past_due'  // grace period, Stripe retries payment
)
```

Update `getAllActiveBrands()` query to include this filter.

## Stripe Integration

### Products & Pricing

- One Stripe product: "SerpAlert Brand Monitoring"
- One price: £149/mo (GBP), recurring
- No Stripe-managed trial (we manage trial via `trialEndsAt` in our DB for flexibility)

### Checkout Flow

When user clicks "Subscribe":
1. Server creates Stripe Checkout session with:
   - `mode: 'subscription'`
   - `customer_email` from Clerk user
   - `metadata.brandId` and `metadata.userId`
   - `success_url: /dashboard?subscribed=true`
   - `cancel_url: /dashboard`
2. User redirected to Stripe Checkout
3. On success, Stripe fires `checkout.session.completed` webhook

### Webhook Endpoint: `/api/webhooks/stripe`

Events to handle:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set brand's `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus = 'active'` |
| `customer.subscription.updated` | Update `subscriptionStatus` based on subscription status |
| `customer.subscription.deleted` | Set `subscriptionStatus = 'canceled'`, checks stop |
| `invoice.payment_failed` | Set `subscriptionStatus = 'past_due'` |

### Customer Portal

- Link from dashboard settings: "Manage Billing"
- Uses Stripe Customer Portal (pre-built by Stripe)
- Allows: update payment method, view invoices, cancel subscription

### Payment Link Generation (Admin)

Admin clicks "Generate payment link" for a brand:
1. Server creates Stripe Checkout session with brand metadata
2. Returns URL that admin can share with client
3. When client pays, webhook activates the brand

## UI Changes

### New Pages

- `/sign-in` — Clerk `<SignIn />` component
- `/sign-up` — Clerk `<SignUp />` component

### Modified Pages

**Dashboard (`/dashboard/page.tsx`)**:
- Filter brands by `userId` from Clerk's `auth()`
- Show trial banner: "X days left in your trial" (yellow, when trialing)
- Show expired banner: "Your trial has expired. Subscribe to resume monitoring." (red, when expired)
- Show subscribed badge on brand cards (green check)
- "Subscribe" button on trial/expired brands → Stripe Checkout

**Dashboard New (`/dashboard/new/page.tsx`)**:
- Set `userId` from Clerk's `auth()` on brand creation
- Set `trialEndsAt` to 7 days from now
- Set `subscriptionStatus` to `'trialing'`
- Enforce plan limits: 1 brand, 3 keywords (check existing brand count for user)

**Admin Brands (`/admin/brands/page.tsx`)**:
- Add "Agency managed" toggle on brand creation form
- Add "Generate payment link" button for non-agency brands without active subscription
- Show subscription status column in brand list

**Layout (`/layout.tsx`)**:
- Add Clerk `<ClerkProvider>` wrapper
- Add user button (avatar/sign-out) in header when authenticated

### Homepage CTA

Update homepage button from generic to:
- "Start Free Trial" → `/sign-up`
- "Sign In" → `/sign-in` (in header)

## Soft Lock Behavior

When a brand's trial expires and there's no active subscription:
- Dashboard shows historical data (checks, competitors, screenshots)
- All data is read-only
- Cron skips this brand (no new checks run)
- Banner at top: "Your monitoring is paused. Subscribe to resume."
- "Subscribe" button prominent
- Client portal for this brand also shows stale data warning

## Trial Tracking

- Trial is per-brand, not per-user (prevents gaming via new accounts)
- `trialEndsAt` is set once on brand creation and never reset
- Admin-created brands: no trial (`trialEndsAt` is null, status depends on agency/payment)
- Cron check compares `trialEndsAt` against `new Date()` in UTC

## Security

- Stripe webhook signature verification using `stripe.webhooks.constructEvent()`
- Clerk middleware in proxy.ts for route protection
- Admin role checked via Clerk `publicMetadata.role`
- ADMIN_SECRET kept as belt-and-suspenders for API routes
- Stripe Checkout session includes `metadata.userId` to prevent cross-user activation
- Payment link: anyone with the link can pay, but the brand is pre-created and linked

## Environment Variables (New)

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key (auto-provisioned via Marketplace)
- `CLERK_SECRET_KEY` — Clerk secret key (auto-provisioned via Marketplace)
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `STRIPE_SECRET_KEY` — Stripe secret key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key
- `STRIPE_PRICE_ID` — Price ID for the £149/mo plan

## Dependencies (New)

- `@clerk/nextjs` — Clerk SDK for Next.js
- `stripe` — Stripe Node.js SDK (server-side)

## What Stays Unchanged

- Client portal (`/client/[token]`) — token-based, no auth changes
- Evidence pages — token-based, no auth changes
- Cron auth — CRON_SECRET header, no changes
- SerpAPI/DataForSEO integration — no changes
- Screenshot/Blob storage — no changes
- Slack alerts — no changes
- Google Ads auto-toggle — no changes
- Budget calculator — no changes

## Out of Scope

- Multiple plan tiers (future: add Starter/Pro/Agency when demand proves it)
- Usage-based billing
- Team/multi-user access to a single brand
- Annual billing discounts
- Coupon/promo codes (can be added in Stripe dashboard without code)
