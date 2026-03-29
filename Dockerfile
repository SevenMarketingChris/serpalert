FROM node:20-slim AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- Build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Provide dummy env vars so Next.js build doesn't crash when
# server modules (postgres, validateEnv) are evaluated at build time.
# Real values are injected at runtime by Coolify.
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npm run build

# --- Production ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost:3000/api/health || exit 1
CMD ["node", "server.js"]
