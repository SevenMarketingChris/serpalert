# SerpAlert Growth Features — Design Spec

**Date:** 2026-03-31
**Status:** Draft
**Scope:** Free brand audit page, calculator page, exit intent popup, agency pricing model, content marketing map, SEO indexing

---

## Core Messaging Hook

**"Stop defending. Start growing."**

Brand campaigns are maintenance spend — you're paying to protect clicks you already own. Non-brand campaigns are growth spend — acquiring new customers who've never heard of you.

SerpAlert lets you swap one for the other: stop paying Google to defend your brand, monitor for competitor activity instead, and reinvest that budget into high-ROI non-brand campaigns that actually scale your business.

**Key stats that support the hook:**
- 80% of brand ad clicks come through organically anyway (Google's own incrementality studies)
- Brand ROAS is artificially inflated — it measures demand capture, not demand creation
- Non-brand campaigns drive 3-8x more incremental revenue per £1 spent
- Every £1,000/mo redirected from brand to non-brand compounds into new customer acquisition

This hook underpins the calculator page, audit page CTA, and all content marketing.

---

## 1. Free Brand Audit Page (`/audit`)

### Purpose
Primary landing page and top of funnel. Runs a live SERP check on any brand keyword, reveals partial results, gates full report behind email capture. Captured leads receive free weekly monitoring for 8 weeks.

### Page Flow

1. **Hero section**
   - Headline: "Are Competitors Stealing Your Brand Clicks?"
   - Subheadline: "Enter your brand keyword — we'll check Google right now. Free, no signup."
   - Single input field for brand keyword + "Check Now" CTA button

2. **Loading state** (2-5 seconds)
   - Animated scanning visual (e.g. pulsing search bar, "Checking Google for [keyword]...")
   - Runs SerpAPI query in background via `POST /api/audit`

3. **Partial results reveal**
   - Summary line: "We found **X competitors** bidding on [keyword]"
   - If competitors found:
     - **1 competitor shown in full**: domain, headline, description, ad position
     - **Remaining competitors blurred**: visible enough to see there's data, but unreadable
     - Email capture form: "Enter your email to see the full report"
   - If no competitors found:
     - "Good news — no competitors are bidding on [keyword] right now"
     - "But this can change any time. Enter your email for weekly monitoring."
     - Still capture email — the ongoing monitoring is the value

4. **Email submission → full reveal**
   - On email submit: unblur all competitors, show full details
   - Send copy of report to their email via Resend
   - Show upsell: "Want real-time alerts when this changes? Start your 7-day free trial"

5. **Weekly monitoring (8 weeks max)**
   - Captured leads get one free SerpAPI check per week
   - Results emailed automatically
   - After 8 weeks: final email — "Your free monitoring has ended. Start your trial to keep watching."
   - Weekly cron job handles this

### Technical Design

**New API route: `POST /api/audit`**
- Input: `{ keyword: string }`
- Runs SerpAPI query only (no DataForSEO, no screenshot — keeps cost at ~£0.01)
- Rate limit: 1 audit per IP per hour (use existing `rate-limit.ts` in-memory limiter)
- Returns: `{ competitorCount: number, competitors: Array<{ domain, headline, description, position }> }`
- No DB storage for the SERP results — stateless response

**New API route: `POST /api/audit/subscribe`**
- Input: `{ email: string, keyword: string, competitorCount: number }`
- Stores in new `audit_leads` table
- Sends full report email via Resend
- Returns: `{ success: true }`

**New DB table: `audit_leads`**
```
- id (UUID, PK)
- email (text, unique per keyword combo)
- keyword (text)
- competitorCount (int, from initial audit)
- weeklyChecksRemaining (int, default 8)
- lastCheckedAt (timestamp, nullable)
- createdAt (timestamp)
- unsubscribed (boolean, default false)
```

**New cron job: weekly audit lead checks**
- Runs weekly (e.g. every Monday at 9am)
- For each lead where `weeklyChecksRemaining > 0` and `unsubscribed = false`:
  - Run SerpAPI check for their keyword
  - Email results via Resend
  - Decrement `weeklyChecksRemaining`
- When `weeklyChecksRemaining` hits 0: send final "monitoring ended" email with trial CTA

**Cost:** ~£0.01 per audit + ~£0.01 per weekly check. 100 leads = ~£0.80/week ongoing.

### Page is a Client Component
The audit flow is interactive (input → loading → reveal → email gate), so the page will be a client component with state management for each step.

---

## 2. Calculator Page (`/calculator`)

### Purpose
SEO-optimised long-form educational page with an interactive walkthrough calculator. Targets "should I bid on my own brand", "brand campaign waste", "brand ads ROI" keywords. Primary CTA pushes to `/audit`.

### Page Structure

**Hero**
- Headline: "The True Cost of Brand Campaigns"
- Subheadline: "Most businesses waste 60-80% of their brand ad spend. Calculate your hidden cost — and see what happens when you redirect it into growth."

**Section 1: The Problem (educational, ~500 words)**
- "The Brand Campaign Trap" — explain how Google incentivises brand bidding
- Stat: 80% of brand clicks come organically (cite Google incrementality studies)
- Stat: Brand ROAS is artificially inflated — measures demand capture, not creation
- Stat: Every £1 on brand ads generates only ~£0.20 of incremental value
- "Your best-performing campaign might be your worst investment"
- Explain: competitors CAN bid on your brand (Google allows it) — but most don't, and you're still paying to defend

**Section 2: Interactive Calculator (walkthrough style)**

Step-by-step reveal rather than all sliders at once:

- **Step 1:** "What do you spend monthly on brand campaigns?" → Slider (£500–£20,000)
- **Step 2:** Animated reveal: "Here's what you're likely wasting" → Shows wasted amount (spend × 0.8 default wastage rate, adjustable)
- **Step 3:** "What if you put that into non-brand campaigns instead?" → Shows projected new customer revenue at typical non-brand ROAS (3-5x, adjustable)
- **Step 4:** Final impact card:
  - Monthly savings from pausing brand
  - Monthly revenue from reinvesting in non-brand
  - Net revenue impact
  - Annual projection
  - Verdict: "Redirecting £X/mo could generate £Y in new revenue this year"

The calculator reuses the financial logic from the existing `budget-calculator.tsx` component but with the step-by-step walkthrough UX and additional context about reinvestment into non-brand growth.

**Section 3: The Alternative**
- "Instead of paying to defend, monitor and react"
- How SerpAlert works (3-step explanation)
- "Alert in <60 minutes when competitors appear. React only when you need to."
- Hook: "Redirect your brand budget into campaigns that actually grow your business"

**CTA Section**
- Primary: "Check if competitors are bidding on your brand" → `/audit`
- Secondary: "Start your 7-day free trial" → `/sign-up`

### Technical Design
- Server component for the educational content (SEO-friendly, static)
- Client component for the interactive calculator section
- Reuse financial calculation logic from existing `budget-calculator.tsx`
- Add `<meta>` tags targeting: "brand campaign waste calculator", "should I bid on my own brand", "brand ads ROI calculator"

---

## 3. Exit Intent Popup

### Purpose
Catches users about to leave public pages, pushes them to the free brand audit as a low-friction conversion point.

### Design
- Clean overlay/dialog: "Before you go..."
- Copy: "Are competitors stealing your brand clicks right now?"
- CTA button: "Free Brand Audit →"
- Subtext: "Takes 10 seconds. No signup required."
- Dismiss button (X) in top-right corner

### Behaviour
- **Trigger (desktop):** Mouse leaves viewport (mouseleave on document)
- **Trigger (mobile):** Not implemented initially (exit intent is unreliable on mobile; revisit later)
- **Frequency:** Once per session (tracked via localStorage flag)
- **Pages:** Homepage, `/calculator`, `/pricing` only — NOT on dashboard, auth, or legal pages
- **Link:** CTA goes to `/audit`

### Technical Design
- New client component: `exit-intent-popup.tsx`
- Uses shadcn Dialog component
- Rendered in root layout for public pages (or a public layout wrapper)
- `useEffect` hook to add `mouseleave` event listener
- localStorage key: `serpalert_exit_shown` with session-based expiry

---

## 4. Agency Partner Pricing Model

### Pricing Structure

Per-brand monthly pricing with volume discounts:

| Brands | Per Brand/month | Discount vs Retail (£149) |
|--------|----------------|--------------------------|
| 1–5    | £109           | 27% off                  |
| 6–15   | £89            | 40% off                  |
| 16+    | £69            | 54% off                  |

### What's Included
- All standard SerpAlert features per brand
- White-label client portals (existing feature)
- Bulk brand management
- Dedicated onboarding support

### Billing
- Per-brand monthly via Stripe
- Auto-adjusts as brands are added/removed
- Price tier recalculates based on total active brands

### Scope for This Phase
- **Document the pricing model** (this spec)
- **Add agency pricing to the `/pricing` page** as a second section below the individual plan
- **Agency enquiries via contact form / email** — no self-serve agency signup yet
- Agency dashboard and self-serve billing is a future phase once demand is validated

---

## 5. Content Marketing Map

### 36 topics organised by funnel stage. All topics are directly relevant to SerpAlert's value proposition.

### Bottom of Funnel (High Intent — Direct Conversion)
1. How to stop competitors bidding on your brand name in Google Ads
2. Best brand bidding monitoring tools [2026 comparison]
3. Competitor ad monitoring for Google Ads — complete guide
4. How to detect if competitors are bidding on your brand keywords
5. Brand keyword monitoring tools — automated alerts for competitor ads
6. Google Ads brand protection: the complete guide
7. PPC brand monitoring: how to track competitor ads on your brand

### Middle of Funnel (Problem Aware — Evaluating Solutions)
8. Should you bid on your own brand name in Google Ads? [Data-driven answer]
9. Brand campaign incrementality: how to test if brand ads are worth it
10. How much of your brand ad spend is wasted? [links to /calculator]
11. What happens when you pause your Google Ads brand campaign
12. Brand ROAS is a lie: why your best-performing campaign is your worst
13. Affiliate brand bidding: how to detect and prevent it
14. Google Ads Auction Insights explained: what competitor data tells you
15. Google trademark policy for ads [2026 update]: what's allowed and what isn't
16. Can you sue a competitor for bidding on your brand name?
17. How to write a cease and desist letter for brand bidding
18. Branded vs non-branded keywords: where should you spend your budget?
19. Why your branded CPC suddenly increased (and what to do about it)
20. How to use Google Ads brand exclusions to stop budget waste

### Top of Funnel (Awareness — Education)
21. What is brand bidding? A complete guide for marketers
22. How Google Ads works for brand keywords (and why competitors exploit it)
23. The brand campaign trap: how Google profits from your brand loyalty
24. How to run a brand campaign incrementality test (step-by-step)
25. How to read your Google Ads Auction Insights report
26. Competitor is bidding on my brand name — what are my options?
27. Google Ads brand campaign best practices [2026]
28. How Performance Max cannibalises your brand traffic (and what to do)
29. What is SERP monitoring and why does it matter for brand protection?
30. The true cost of Google Ads brand campaigns [industry benchmarks]

### Link-Worthy / Resource Pages
31. Brand campaign savings calculator [interactive tool — /calculator]
32. Free brand audit: check if competitors are bidding on your brand [/audit]
33. Google Ads trademark complaint template [downloadable]
34. Cease and desist letter template for brand bidding [downloadable]
35. Brand bidding policy template for affiliate programmes
36. Brand protection checklist for PPC managers [PDF]

### Content is NOT in scope for this build phase. This map is documented for future execution.

---

## 6. Enable SEO Indexing

### Changes
- Flip `robots` in root layout metadata from `{ index: false, follow: false }` to `{ index: true, follow: true }`
- Add dynamic sitemap at `/sitemap.xml` (Next.js `sitemap.ts` convention)
  - Include: `/`, `/pricing`, `/calculator`, `/audit`, `/privacy`, `/terms`
  - Exclude: `/dashboard/*`, `/admin/*`, `/api/*`, `/sign-in`, `/sign-up`
- Submit sitemap to Google Search Console (manual step, not code)

---

## Summary of Deliverables

| Deliverable | Type | Priority |
|-------------|------|----------|
| `/audit` page + API + DB table + weekly cron | New feature | P0 |
| `/calculator` page with walkthrough calculator | New page | P0 |
| Exit intent popup component | New component | P1 |
| Agency pricing section on `/pricing` | Page update | P1 |
| Enable indexing + sitemap | Config change | P0 |
| Content marketing map (36 topics) | Documentation | Done (this spec) |
| Agency pricing model | Documentation | Done (this spec) |

---

## Out of Scope
- Agency self-serve dashboard / billing
- Content article writing
- Case studies
- Google Ads integration on audit page
- Screenshot capture on free audit
- Mobile exit intent
