# SerpAlert Design Overhaul — Full Spec

**Date:** 2026-03-23
**Scope:** Full redesign — landing page, admin, user dashboard, client portal
**Business model:** Standalone SaaS
**Visual direction:** Enhanced tech/neon (existing SerpAlert design system, refined)

---

## 1. Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Dashboard philosophy | Hybrid — status hero + metrics + alert feed with tabs | Combines at-a-glance safety status (BrandVerity pattern) with actionable feed (Adalysis pattern) |
| Alert model | Detection → Evidence package → Status tracking | Turns SerpAlert from notification tool into workflow tool |
| Visual tone | Existing tech/neon, enhanced | Dark blue-gray backgrounds, OKLch palette, Geist fonts, colored metric stripes, subtle neon glow. Refined, not replaced. |
| Navigation | Persistent sidebar with brand switcher | Quick-switch between brands, section nav, plan info |
| Admin model | Role-based, not separate app | Admins see extra controls in the same dashboard, no separate admin pages |
| Client portal | Simplified read-only report | Same visual system, no actions, branded footer |
| Landing page | Full redesign | Tighter copy, dashboard preview centrepiece, matching tech/neon style |

---

## 2. Page Structure

```
/                                → Marketing/landing page (public)
/login                           → Google OAuth sign-in
/dashboard                       → Brand list (users see their brands)
/dashboard/[brandId]             → Brand monitoring dashboard (main view)
/dashboard/[brandId]/competitors → Competitor deep-dive
/dashboard/[brandId]/insights    → Auction insights + future analytics
/dashboard/[brandId]/settings    → Brand settings (keywords, domain, integrations)
/dashboard/new                   → Create new brand
/admin/brands                    → All brands management (admin role)
/client/[token]                  → Client portal (white-label, no auth)
/evidence/[checkId]              → Shareable evidence page (public, unique URL)
```

**Key structural changes:**
- Admin is a role, not a separate app — admins see extra controls in the same dashboard
- `/admin` redirects to `/admin/brands` (single admin page for managing all brands)
- `/admin/edit/[brandId]` removed — settings are inline in `/dashboard/[brandId]/settings`
- Brand switcher in sidebar replaces navigating back to brand list
- New `/evidence/[checkId]` public page for shareable evidence cards (`checkId` is a UUID — not enumerable)
- Landing page CTA ("Start Monitoring Free") links to `/login` — first-time users get a free plan auto-provisioned on first OAuth sign-in, then redirect to `/dashboard/new`

---

## 3. Sidebar Navigation

Persistent left sidebar inside `/dashboard/*`. Width: 220px on desktop.

**Responsive behaviour:**
- **≥1024px (lg):** Full sidebar with text labels
- **768–1023px (md):** Collapsed to 56px icon-only rail
- **<768px (sm):** Hidden entirely, accessible via hamburger icon in top bar. Opens as an overlay (not push).

**Contents (top to bottom):**
- SerpAlert logo (gradient text: blue→cyan, using `text-gradient-tech`)
- Brand switcher dropdown (current brand name + chevron, dropdown lists all user's brands)
- Section nav:
  - Overview (default, maps to `/dashboard/[brandId]`)
  - Competitors (maps to `/dashboard/[brandId]/competitors`)
  - Insights (maps to `/dashboard/[brandId]/insights`)
  - Settings (maps to `/dashboard/[brandId]/settings`)
- Divider
- Plan info (plan name, keyword usage: "3/25 keywords")
- User avatar + sign out

**Admin extras visible in sidebar:**
- "All Brands" link at top (goes to `/admin/brands`)
- Settings section shows additional fields (spend, ROAS, Slack webhook, Google Ads ID)

---

## 4. Brand List (`/dashboard`) & Create Brand (`/dashboard/new`)

### 4.0a Brand List (`/dashboard`)

Grid of brand cards. Each card shows:
- Brand name (bold), domain (monospace, muted)
- Plan badge (colored pill: free=gray, starter=blue, professional=purple, agency=orange)
- Keyword count: "X keywords"
- Last check status: green dot "Protected" or red dot "X threats"
- Actions: "Open Dashboard" button

**Empty state (new user, no brands):**
- Centred card: "Welcome to SerpAlert" heading, subtext "Start monitoring your brand keywords", "Create Your First Brand" CTA button → `/dashboard/new`

**Admin view:** Shows all brands across all users, with a "User" column showing owner email.

### 4.0b Create Brand (`/dashboard/new`)

Form page within the sidebar layout.

**Fields:**
- Brand Name (required, text input)
- Domain (optional, text input, placeholder "yourbrand.com")
- Keywords (required, textarea, one per line, with plan limit shown: "3/3 keywords used" for free tier)

**On submit:** Server action `createBrand()`, validates plan limits, redirects to `/dashboard/[brandId]`.

**Plan limits table:**

| Plan | Brands | Keywords | Check frequency |
|------|--------|----------|----------------|
| Free | 1 | 3 | 3x/day |
| Starter | 3 | 25 | 3x/day |
| Professional | 10 | 100 | 6x/day |
| Agency | 50 | 500 | 12x/day |

These limits are enforced in `createBrand()` and `updateBrand()` server actions.

---

## 4. Brand Dashboard — Overview (`/dashboard/[brandId]`)

### 4.1 Status Hero

Full-width card at the top. Two states:

**Protected (no threats in last 24h):**
- Background: gradient from dark green to base dark (oklch 25% 0.08 155 → oklch 14% 0.025 250)
- Border: green with 30% opacity (oklch 55% 0.18 155 / 0.3)
- Subtle green glow (box-shadow)
- Shield icon (🛡) in a circular badge
- Text: "BRAND PROTECTED" in green (oklch 75% 0.18 155)
- Subtext: "No competitors detected in last 24h · Last check X min ago"
- "Run Check Now" button (primary blue, neon glow)

**Threats detected:**
- Background: gradient from dark red to base dark (oklch 25% 0.08 15 → oklch 14% 0.025 250)
- Border: red with 30% opacity (oklch 52% 0.22 15 / 0.3)
- Red glow
- Alert icon (⚠) in circular badge
- Text: "X THREATS DETECTED" in red (oklch 65% 0.22 15)
- Subtext: "X competitor(s) bidding on your brand · Last check X min ago"
- "Run Check Now" button

### 4.2 Metric Cards

Responsive grid below the hero: 4 columns on lg, 2 columns on sm, 1 column on xs. Each card:
- Background: oklch(16% 0.025 250)
- Border: oklch(22% 0.03 250)
- Top stripe: 3px colored border (existing `metric-stripe-*` pattern)
- Label: uppercase, letter-spaced, Geist Mono, muted color
- Value: large, bold, Geist Mono, accent color matching stripe

**Cards:**
1. **Checks Today** — blue stripe (oklch 62% 0.22 250), integer count
2. **Threats Today** — green stripe if 0, red stripe if >0 (dynamic), integer count
3. **Keywords** — purple stripe (oklch 72% 0.15 310), integer count
4. **7d Trend** — orange stripe (oklch 72% 0.15 55), inline sparkline showing threats-per-day for the last 7 days. Uses Unicode blocks (▁▂▃▄▅▆▇█) normalised to the max value in the window. If <7 days of data, pad left with ▁.

**Admin-only cards (appended to grid when admin):**
5. **Monthly Spend** — blue stripe, formatted as £X,XXX.XX
6. **Brand ROAS** — cyan stripe, formatted as Xx

### 4.3 Tabs

Horizontal tab bar below metrics. These are **navigation links styled as tabs** — each navigates to a sub-page under the sidebar layout (not inline tab panels):
- **Activity** (default) — `/dashboard/[brandId]` — alert feed
- **Competitors** — `/dashboard/[brandId]/competitors` — leaderboard table
- **Insights** — `/dashboard/[brandId]/insights` — auction charts

Active tab: 2px bottom border in primary blue, white text. Determined by current pathname.
Inactive: muted text, no border.
Style: uppercase, letter-spaced, 11px, matching existing tab pattern.

### 4.4 Activity Feed

Chronological feed of SERP checks, newest first. Loads 20 items initially, with a "Load more" button at the bottom (not infinite scroll — explicit pagination). Empty state: "No SERP checks yet — data will appear after the first scheduled check." with a prominent "Run Check Now" CTA.

Each item is a card with:

**Layout:**
- Left border: 3px colored (red for threat, green for clear, orange for reported, cyan for resolved)
- Row 1: Status badge + competitor domain + "on" + keyword (purple, monospace) + timestamp (right-aligned, monospace)
- Row 2 (threats only): Ad copy snippet — "Ad: headline — description" · Position N
- Row 3 (threats only): Action buttons — Screenshot, Evidence, Report/status change + Status badge (right-aligned, with glow)

**Status badges:**
- `NEW` — red background tint (oklch 52% 0.22 15 / 0.12), red text, subtle red glow
- `ACKNOWLEDGED` — blue background tint, blue text
- `REPORTED` — orange background tint (oklch 72% 0.15 55 / 0.12), orange text
- `RESOLVED` — cyan background tint (oklch 72% 0.15 195 / 0.12), cyan text, card at 70% opacity

**Action buttons:**
- 📸 Screenshot — opens screenshot modal
- 📋 Evidence — opens evidence modal or navigates to `/evidence/[checkId]`
- Status action button (label changes by current state):
  - When `new`: "Acknowledge" → sets status to `acknowledged`
  - When `acknowledged`: "Mark Reported" → sets status to `reported`
  - When `reported`: "Resolve" → sets status to `resolved`
  - When `resolved`: no action button (card is faded)
- Transitions are forward-only (no going backwards). To undo, an admin can reset via Settings or API.

**"Run Check Now" button states:**
- Idle: primary blue button with neon glow
- Loading: spinner icon, "Checking..." text, button disabled
- Success: green text "Checked X keywords — Y ads found", auto-refreshes page via `router.refresh()` after 2s
- Error: red text "Check failed — try again", button re-enabled
- Rate limit: disabled for 60s after a manual check to prevent spam

**Filters (above the feed):**
- Pill buttons: All | New | Unresolved | Resolved
- Default: "Unresolved" (shows NEW + ACKNOWLEDGED + REPORTED)

**Clear checks:** Single-line card with green left border, "CLEAR" badge, keyword, timestamp. No actions.

---

## 5. Competitors Page (`/dashboard/[brandId]/competitors`)

Ranked table of all competitor domains detected.

**Table columns:**
| Column | Description |
|--------|-------------|
| Rank | # position by detection count (top 3 get gold/silver/bronze metric stripe) |
| Domain | Competitor domain name (monospace) |
| Detections | Total count of times detected |
| Keywords | Keywords they've bid on (as purple tags, max 3 shown + "+N more") |
| Last Seen | Relative timestamp (monospace) |
| Status | Active (seen in last 7 days) / Inactive (not seen recently) |
| Trend | 30-day sparkline of detection frequency |

**Mobile layout:** On screens <768px, the table converts to stacked cards (one card per competitor) showing domain, detection count, last seen, and status. Expansion works by tapping the card.

**Desktop row expansion:** Click a row to expand and show:
- All ad copy variants (AdCopyCard component, restyled)
- Screenshot history (thumbnail grid, clickable to open modal)
- Destination URLs (list)
- First seen / last seen dates
- Detection frequency chart

**Active/Inactive indicator:**
- Active: green dot + "Active" text
- Inactive: gray dot + "Inactive" text

---

## 6. Insights Page (`/dashboard/[brandId]/insights`)

For brands with Google Ads connected (`googleAdsCustomerId`):

**Auction Insights chart:**
- Recharts line chart (existing component, restyled)
- Shows impression share (%) per competitor domain over last 30 days
- Uses tech color palette for lines
- Tooltip with domain name + share %

**Future sections (stubs for now):**
- SEO Metrics panel (Ahrefs integration planned)
- Monthly Reports (planned)

For brands without Google Ads: show a setup prompt card with instructions.

---

## 7. Settings Page (`/dashboard/[brandId]/settings`)

Replaces `/admin/edit/[brandId]`. All users can edit:
- Brand name
- Domain
- Keywords (with plan limit indicator)

Admin-only fields (visible when admin role):
- Monthly brand spend
- Brand ROAS
- Google Ads Customer ID
- Slack webhook URL
- Active/inactive toggle

**Client portal section:**
- Client token (read-only, with copy button)
- Link to client portal (clickable, with copy button)

**Danger zone:**
- Delete brand (with confirmation dialog)

---

## 8. Client Portal (`/client/[token]`)

Single-page report, no authentication, no sidebar.

**Layout (top to bottom):**
1. **Header** — "Brand Protection Report" subtitle, brand name (gradient text), theme toggle
2. **Status hero** — same green/red pattern as main dashboard but without "Run Check Now" button
3. **Metric cards** — 4 cards: Keywords, Total Checks, Today status, All-Time Competitors
4. **7-day activity chart** — bar chart, refined with tech colors (primary/30 for clear days, destructive/70 for threat days)
5. **Competitor domains table** — read-only version of the Competitors page table (no expansion, no actions)
6. **Recent detections feed** — same card layout as Activity feed but without action buttons (Screenshot button stays for evidence viewing)
7. **Footer** — "Last check: [datetime]" · "Monitoring X keywords · 3 checks per day" · "Protected by SerpAlert" with link

---

## 9. Evidence Page (`/evidence/[checkId]`)

New public page. Shareable URL for a specific detection.

**Layout:**
- Clean single-card page (no nav, no sidebar)
- SerpAlert branding at top
- Evidence card containing:
  - SERP screenshot (full width, with timestamp overlay)
  - Competitor domain + destination URL
  - Full ad copy (headline + description + display URL)
  - Keyword targeted
  - Detection timestamp
  - Location (e.g., "United Kingdom")
  - Device (e.g., "Desktop")
- "Copy link" button
- "Protected by SerpAlert" footer

---

## 10. Landing Page (`/`)

Full redesign, dark theme throughout.

**Sections (top to bottom):**
1. **Hero** — bold headline ("Stop competitors stealing your brand clicks"), subtext, single CTA ("Start Monitoring Free"), animated dot-grid background
2. **Social proof strip** — "Monitoring X brand keywords across Y brands"
3. **Problem/Solution** — 3-column: "Competitors bid on your brand" → "Your CPC rises, CTR drops" → "SerpAlert detects and alerts in minutes"
4. **How it works** — 3 steps with icons: Add keywords → Monitor 3x daily → Get instant alerts
5. **Dashboard preview** — mockup of brand dashboard in a browser chrome frame
6. **Features grid** — 6 cards with icons: Real-time monitoring, SERP screenshots, Competitor tracking, Evidence packages, Slack alerts, Client portal
7. **Pricing** — 4 tier cards (Free/Starter/Professional/Agency) with metric-stripe accent per tier
8. **ROI calculator** — interactive calculator (keep existing logic, restyle)
9. **CTA footer** — "Protect your brand today" + sign-up button

---

## 11. Screenshots Fix

**Root cause:** Supabase storage bucket likely lacks public read policy.

**Fixes:**
1. Ensure `screenshots` bucket in Supabase has public read access (RLS policy: `SELECT` for anonymous users)
2. Add `unoptimized` prop to Next.js `<Image>` component for Supabase URLs (bypasses Next.js image optimization which can fail for external hosts)
3. Add error handling in ScreenshotModal — `onError` handler shows fallback message ("Screenshot unavailable") instead of broken image
4. Add loading state (skeleton) while image loads

---

## 12. Evidence Package (New Feature)

**Data model:**
No new table needed. Evidence is derived from existing `serp_checks` + `competitor_ads` records.

**Evidence modal:** When "Evidence" button is clicked on a threat:
- Modal shows formatted evidence card (same layout as `/evidence/[checkId]` page)
- "Copy link" button copies the shareable URL
- "Open in new tab" button

**Evidence page (`/evidence/[checkId]`):**
- Server component, fetches SerpCheck + CompetitorAds by check ID
- `checkId` is a UUID (from `serp_checks.id`) — not enumerable
- Public (no auth), but only accessible if you know the UUID
- Returns 404 for invalid/non-existent IDs
- Renders the evidence card with all details

---

## 13. Status Tracking (New Feature)

**Schema change:**
Add `status` column to `competitor_ads` table using a Drizzle `text` column with a type union (not a Postgres enum — avoids migration complexity):

```typescript
// In schema.ts
status: text('status', { enum: ['new', 'acknowledged', 'reported', 'resolved'] }).notNull().default('new'),
```

Drizzle migration:
```sql
ALTER TABLE competitor_ads ADD COLUMN status TEXT NOT NULL DEFAULT 'new';
```

**State machine (forward-only):**
```
new → acknowledged → reported → resolved
```
No backward transitions via UI. Admin can reset via API if needed.

**New query functions:**
- `updateCompetitorAdStatus(id: string, status: string)` — updates status
- `getUnresolvedAdsForBrand(brandId: string)` — returns ads with status != 'resolved'

**New API route:**
- `PATCH /api/brands/[brandId]/ads/[adId]/status` — updates status, requires auth + ownership check

**UI integration:**
- Status badge on each threat card in Activity feed
- Inline action buttons change status (click "Report" → status becomes "reported")
- Filter pills above Activity feed: All | New | Unresolved | Resolved

---

## 14. Admin Changes

**Removed pages:**
- `/admin/edit/[brandId]` — replaced by `/dashboard/[brandId]/settings`

**Changed pages:**
- `/admin` → redirects to `/admin/brands`
- `/admin/brands` — table of all brands with: name, domain, keywords, plan, status, actions (Dashboard, Client Portal, Edit Settings). "Edit Settings" navigates to `/dashboard/[brandId]/settings` — the sidebar auto-updates to show that brand's context.

**Admin role detection:**
- Same as current: `isAdminEmail(session.user?.email)` checking `ADMIN_EMAILS` env var
- Admin-only UI elements wrapped in conditional render

---

## 15. Loading & Error States

**Loading states:** Every page and data-dependent section uses skeleton placeholders matching the final layout shape:
- Status hero: gray gradient block at full width, 80px height
- Metric cards: 4 skeleton cards with pulsing animation
- Activity feed: 3 skeleton cards with left border placeholder
- Tables: skeleton rows with column-width-matched blocks

Use Next.js `loading.tsx` files per route segment for page-level loading. Use React Suspense boundaries for component-level loading within pages.

**Error states:**
- API failures: inline error card with red left border, "Failed to load [section] — try refreshing" message
- Empty data: contextual empty states per section (not a generic "no data" message)
- Auth errors: redirect to `/login` with flash message

**Client portal token management:**
- Tokens are UUIDs, auto-generated on brand creation (existing behaviour)
- Tokens cannot be rotated in v1 (future feature)
- Invalid/non-existent tokens show a styled 404 page: "This report is not available" with SerpAlert branding
- No rate limiting on client portal (it's read-only server-rendered)

---

## 16. Design System Refinements

**Keep:**
- OKLch color model
- Dark theme as primary (oklch 12%/16%/14% backgrounds)
- Metric stripe pattern (3px colored top border)
- Geist Sans + Geist Mono typography
- `text-gradient-tech` for logo/headings
- `tech-card-hover` lift effect
- Destructive/success color tokens

**Refine:**
- Remove `neon-glow` from general use — reserve for status hero and primary CTA buttons only
- Standardise card pattern: consistent padding (14px), border radius (8px), border color
- Status badge system: consistent tinted backgrounds with matching text color, Geist Mono font
- Action button style: dark background (oklch 20%), light text, 1px border, 6px radius, monospace
- Sparkline: text-based using Unicode block characters (▁▂▃▄▅▆▇█)

**New additions:**
- Status color scale: red (new) → blue (acknowledged) → orange (reported) → cyan (resolved)
- Sidebar pattern: darker background (oklch 14%), section active state with primary tint
- Brand switcher dropdown component
- Evidence card layout

---

## 16. Component Changes Summary

| Component | Action | Notes |
|-----------|--------|-------|
| `competitor-timeline.tsx` | **Replace** | Becomes the Activity feed with status tracking and inline actions |
| `ad-copy-card.tsx` | **Restyle** | Keep logic, update to new card pattern |
| `auction-chart.tsx` | **Restyle** | Keep Recharts, update colors to tech palette |
| `screenshot-modal.tsx` | **Fix + Restyle** | Add error handling, unoptimized prop, loading skeleton |
| `manual-check-button.tsx` | **Move** | Moves into status hero component |
| `roi-calculator.tsx` | **Restyle** | Keep logic, update visual style |
| `auth-page.tsx` | **Restyle** | Match new visual system |
| New: `status-hero.tsx` | **Create** | Protected/threat status indicator |
| New: `activity-feed.tsx` | **Create** | Chronological alert feed with actions |
| New: `threat-card.tsx` | **Create** | Individual threat with status + actions |
| New: `competitor-table.tsx` | **Create** | Ranked competitor leaderboard |
| New: `evidence-modal.tsx` | **Create** | Evidence package viewer |
| New: `sidebar.tsx` | **Create** | Persistent sidebar with brand switcher |
| New: `brand-switcher.tsx` | **Create** | Dropdown brand selector |
| New: `status-filter.tsx` | **Create** | Pill filter for activity feed |
| Remove: `seo-metrics-panel.tsx` | **Remove** | Stub, moved to Insights page future |
| Remove: `seo-competitor-table.tsx` | **Remove** | Stub |
| Remove: `top-keywords-table.tsx` | **Remove** | Stub |
| Remove: `monthly-report-tab.tsx` | **Remove** | Stub |
