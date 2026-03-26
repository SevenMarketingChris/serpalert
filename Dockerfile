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
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    AUTH_SECRET="build-time-placeholder-value-min-32-chars!" \
    AUTH_GOOGLE_ID="build-placeholder" \
    AUTH_GOOGLE_SECRET="build-placeholder"
RUN npm run build

# --- Production ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Chromium dependencies for Puppeteer screenshots
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
    libatk1.0-0 libcups2 libdbus-1-3 libdrm2 libgbm1 libglib2.0-0 \
    libgtk-3-0 libnspr4 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 \
    libxrandr2 xdg-utils wget curl \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Create writable dirs for Chromium (crashpad, temp profiles)
RUN mkdir -p /tmp/chromium-data /home/nextjs/.cache && \
    chown -R nextjs:nodejs /tmp/chromium-data /home/nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost:3000/api/health || exit 1
CMD ["node", "server.js"]
