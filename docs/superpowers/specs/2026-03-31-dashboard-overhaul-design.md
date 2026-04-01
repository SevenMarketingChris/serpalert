# SerpAlert Dashboard Overhaul — Design Spec

## Goal

Overhaul the internal dashboard pages: visual refresh (light base, indigo accent, modern SaaS aesthetic), simplified UX (remove status workflow, single-brand focus), and new functionality (competitor timeline, CSV export, auto-refresh, alert config).

## Visual System

### Theme: Light + Indigo Accent

- **Background:** `#fafafa` (page), `#fff` (cards)
- **Borders:** `#e5e7eb` with optional soft shadow (`0 1px 3px rgba(0,0,0,0.05)`)
- **Sidebar:** `#f5f5f7` background, indigo active states
- **Accent:** Indigo `#6366f1` for interactive elements, labels, active nav
- **Text:** `#111827` headings, `#6b7280` secondary, `#9ca3af` tertiary
- **Monospace:** Used for all data values (counts, domains, timestamps)
- **Status colours:**
  - Green: `bg-emerald-50 text-emerald-700 border-emerald-200` (protected/clear)
  - Red: `bg-red-50 text-red-700 border-red-200` (threats)
  - Amber: `bg-amber-50 text-amber-700 border-amber-200` (warnings)
  - Indigo: `bg-indigo-50 text-indigo-700 border-indigo-200` (info/accent)
- **Radius:** `rounded-xl` for cards, `rounded-lg` for buttons/inputs, `rounded-full` for badges
- **Shadows:** Minimal — `shadow-sm` on cards only

### Typography

- **Headings:** Geist Sans, semibold/bold
- **Body:** Geist Sans, regular
- **Data:** Geist Mono for all numeric values, domains, timestamps
- **Labels:** 10-11px, uppercase, tracking-wide, muted color

## Layout

### Sidebar (Simplified)

Width: 220px (desktop), icon rail 56px (tablet), hamburger drawer (mobile).

**Contents (top to bottom):**
1. SerpAlert logo (indigo gradient text)
2. Brand name (plain text if single brand, dropdown if 2+)
3. Nav items:
   - Overview (LayoutDashboard icon)
   - Competitors (Shield icon)
   - Screenshots (Camera icon)
   - Settings (Settings icon)
4. Divider
5. Subscription status badge (trial/active)
6. Admin link (conditional, admin users only)

**Removed from sidebar:**
- Insights tab (moved to settings as a sub-section)
- Dashboard tabs component (sidebar handles all navigation)
- Plan info / keyword count (move to settings)

**Active state:** Indigo background tint (`bg-indigo-50`), indigo text, left border accent.

### Single-Brand Focus

- If user has 1 brand: sidebar shows brand name as static text, no dropdown
- If user has 2+ brands (or is admin): brand switcher dropdown appears
- Admin users see agency brands with an "Agency" label

## Pages

### Overview Page (main dashboard, `/dashboard/[brandId]`)

Single scrollable page, all key information visible. Sections top-to-bottom:

**a) Status Banner**
- Full-width card, top of page
- Two states:
  - Protected: green-tinted background, shield-check icon, "Brand Protected" text, "No competitors detected today"
  - Threats: red-tinted background, alert-triangle icon, "X Threats Detected" text, "X competitors bidding on your brand"
- Right side: "Last check: Xm ago" + manual check button (indigo, outlined)
- No sparkline in the banner (moved to metrics)

**b) Metric Cards (4 across, responsive to 2x2 on mobile)**
- Checks today (number)
- Active competitors (unique domains, last 7 days)
- Keywords monitored (number)
- 7-day trend (sparkline using thin bars, not unicode blocks)

Each card: white bg, border, subtle shadow. Label on top (uppercase, tiny, muted), big number below (monospace, bold).

**c) Recent Activity (latest scan)**
- Card showing the most recent scan run, expanded
- For each keyword checked:
  - Keyword name (monospace, indigo badge)
  - Result: "Clear" (green) or "X competitors" (red) + domain names inline
  - Screenshot thumbnail (small, right-aligned, click to expand)
- "View all activity" link at bottom → scrolls to full feed below

**d) Activity Feed (all scans)**
- Collapsible scan runs, newest first
- Each run shows: time, keyword count, threat count, left-border color (green/red)
- Click to expand → shows per-keyword results with competitor details
- No status filter (statuses removed)
- Pagination: show 10, "Load more" button

**e) 30-Day Trend Chart**
- Recharts BarChart with proper axes
- X-axis: dates (show every 5th day label)
- Y-axis: count
- Two bar series: checks (indigo-200) and threats (red-400)
- Tooltip on hover
- White card with border

**f) Active Competitors Summary**
- Compact table at bottom of overview
- Columns: Domain, Times Seen (30d), Keywords, Last Seen
- Click row → navigates to `/dashboard/[brandId]/competitors` with that domain highlighted
- Max 5 rows, "View all competitors →" link

### Competitors Page (`/dashboard/[brandId]/competitors`)

- Clean table with proper column widths
- Columns: Domain, Avg Position, Last 30d, Total (90d), Keywords, First Seen, Last Seen
- Remove rank badges (gold/silver/bronze)
- Remove WastedSpendBadge
- Click row to expand inline: shows ad copy history (headline, description, display URL) as a sub-table
- CSV export button (top-right, indigo outlined button)
- Empty state: Shield icon + "No competitors detected yet"

### Screenshots Page (`/dashboard/[brandId]/screenshots`)

- Date-grouped gallery (keep current pattern)
- Add keyword filter dropdown at top
- 2-column grid on desktop, 1 on mobile
- Larger card thumbnails
- Click to open full-size in modal
- Threat indicator on each card (green dot or red dot + count)

### Settings Page (`/dashboard/[brandId]/settings`)

- Max-width form layout (keep current `max-w-2xl`)
- Sections:
  1. Brand Details (name, domain, keywords with limit indicator)
  2. Keyword Suggestions (AI recommendations)
  3. Alert Configuration (Slack webhook URL, quiet hours — new)
  4. Google Ads Integration (customer ID, campaign ID — moved from admin settings)
  5. Auction Insights (moved from standalone page)
  6. Client Portal (token sharing)
  7. Admin Settings (agency toggle, spend, ROAS — admin only)
  8. Delete brand (simple red text link at very bottom, no "danger zone" card)

### Dashboard Home (`/dashboard` — brand list page)

- Shows when user has 0 brands or needs to pick one
- Single-brand users auto-redirect to `/dashboard/[brandId]`
- Admin sees all brands (personal + agency)
- Brand cards: name, domain, status badge, threat indicator, last check time
- "Create Your First Brand" CTA for empty state

## Removed Features

| Feature | Reason |
|---------|--------|
| Status workflow (new/acknowledged/reported/resolved) | Doesn't do anything functional |
| Status filter on activity feed | No statuses to filter |
| DashboardTabs component | Sidebar handles navigation |
| Evidence modal on threat cards | Keep PDF/C&D but access from competitor detail page |
| Budget redirect summary on dashboard | Sales tool, belongs on homepage only |
| Google Ads status component on overview | Move to settings |
| Insights as standalone page | Low usage, move to settings sub-section |

## New Features

### 1. CSV Export (Competitors page)
- Button: "Export CSV" on competitors page
- Downloads: domain, avg_position, count_30d, count_total, keywords, first_seen, last_seen
- Server action that queries DB and returns CSV response

### 2. Competitor Timeline (Competitors page)
- Click a competitor row → expand inline
- Shows: every date they were detected, which keywords, ad copy used
- Simple chronological list, newest first

### 3. Auto-Refresh Indicator
- Pulse dot in status banner when a cron check is running
- Timestamp updates reactively: "Last check: just now"
- Not real-time WebSocket — just revalidate on focus/interval (60s)

### 4. Alert Configuration (Settings page)
- Slack webhook URL (already exists, just move to dedicated section)
- Alert threshold: "Only alert if X+ competitors detected" (default: 1)
- Quiet hours: start/end time (default: off)
- Store as JSON in a new `alertConfig` column on brands table

### 5. "What's New" Badge
- Dot indicator on sidebar nav items with new data since last visit
- Track last-viewed timestamp per section per user
- Store in localStorage (not DB — low priority, client-side only)

### 6. Auto-Redirect for Single Brand
- If user has exactly 1 brand, `/dashboard` redirects to `/dashboard/[brandId]`
- Removes one click from the flow for 95% of users

## Database Changes

### Modified: `brands` table
- Add column: `alertConfig jsonb default '{}'` — stores threshold, quiet hours

### Removed
- `status` column on `competitor_ads` table — no longer needed (values: new/acknowledged/reported/resolved)
- Keep the column in DB for now (data preservation) but stop reading/writing it

## Migration Notes

- Remove all `updateCompetitorAdStatus`, `updateAllAdsStatusForCheck`, `getUnresolvedAdsForBrand`, `getUnresolvedThreatCount` functions from queries.ts
- Remove status-related API routes (`/api/brands/[brandId]/ads/[adId]/status`, `/api/brands/[brandId]/checks/[checkId]/status`)
- Remove `StatusFilter` from activity feed
- Remove `DashboardTabs` component
- Remove `GoogleAdsStatus` component from overview (move config to settings)
- Remove `BudgetRedirectSummary` from overview
- Update sidebar to remove brand switcher for single-brand users
- Update all page components with new visual styling

## Out of Scope

- Dark mode toggle (light only for now, can add later)
- Email digest configuration (future feature)
- Real-time WebSocket updates (polling is sufficient)
- Multi-user team access
- Notification center / in-app alerts
