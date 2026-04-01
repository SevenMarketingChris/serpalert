# SerpAlert

Brand keyword monitoring that protects your search presence. Get hourly alerts when competitors bid on your brand name.

**Live:** [serpalert.co.uk](https://serpalert.co.uk)

## Features

- Hourly SERP monitoring (24x daily)
- Screenshot evidence capture
- Competitor ad copy tracking
- Slack alerts for new competitors
- PDF evidence reports
- CSV export
- Client portals for agencies
- Google Ads auto-toggle integration

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Frontend:** React 19, Tailwind CSS, Radix UI
- **Auth:** Clerk (via Vercel Marketplace)
- **Database:** Neon PostgreSQL via Drizzle ORM
- **Payments:** Stripe
- **Storage:** Vercel Blob
- **Email:** Resend
- **SERP Data:** DataForSEO, SerpAPI
- **AI:** Anthropic Claude
- **Hosting:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Neon PostgreSQL database
- Clerk, Stripe, Resend, DataForSEO, SerpAPI, and Anthropic API keys

### Setup

```bash
# Clone the repo
git clone https://github.com/SevenMarketingChris/serpalert.git
cd serpalert

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Fill in your API keys in .env.local
# CRITICAL: CRON_SECRET and ADMIN_SECRET are required at startup

# Run database migrations
npx drizzle-kit push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available Scripts

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test:run     # Run tests (Vitest)
npm run test:watch   # Run tests in watch mode
```

## Project Structure

```
src/
  app/
    api/              # API routes
      brands/         # Brand CRUD and monitoring
      cron/           # Scheduled SERP checks
      webhooks/       # Stripe webhooks
      audit/          # Public audit tool
    dashboard/        # Authenticated dashboard
    admin/            # Admin panel
    pricing/          # Public pricing page
    blog/             # Blog posts
    privacy/          # Privacy policy
    terms/            # Terms of service
  components/         # React components
    ui/               # Base UI components (shadcn-style)
  lib/
    db/               # Drizzle schema and queries
    __tests__/        # Unit tests
    email.ts          # Email templates (Resend)
    serpapi.ts        # SerpAPI client
    dataforseo.ts     # DataForSEO client
    auth.ts           # Clerk auth helpers
    env.ts            # Environment validation
```

## Environment Variables

See `.env.example` for the full list. Critical variables that must be set:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `CRON_SECRET` | Secures cron job endpoints |
| `ADMIN_SECRET` | Secures admin API access |
| `CLERK_SECRET_KEY` | Clerk auth server key |
| `STRIPE_SECRET_KEY` | Stripe payment processing |

## Deployment

Deployed on Vercel. Push to `main` triggers automatic deployment.

Production auth requirement:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` must be a Clerk live key (`pk_live_...`)
- `CLERK_SECRET_KEY` must be a Clerk live key (`sk_live_...`)
- production should not rely on `*.clerk.accounts.dev` assets or auth flows

```bash
# Or deploy manually
npx vercel --prod
```

## License

Proprietary. All rights reserved.
