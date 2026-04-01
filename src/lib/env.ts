function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/**
 * Validate critical env vars at startup (fail fast).
 */
export function validateEnv(): void {
  const errors: string[] = [];

  const critical = ['DATABASE_URL', 'DATAFORSEO_LOGIN', 'DATAFORSEO_PASSWORD', 'SERPAPI_KEY', 'ADMIN_SECRET', 'CRON_SECRET', 'BLOB_READ_WRITE_TOKEN', 'CLERK_SECRET_KEY', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'] as const;

  // Stripe vars are optional at startup — only needed for billing routes
  const recommended = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_ID', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'RESEND_API_KEY', 'ANTHROPIC_API_KEY'] as const;
  for (const name of recommended) {
    const val = process.env[name];
    if (!val || val.trim() === '') {
      console.warn(`Warning: ${name} is not set — billing features will not work`);
    }
  }
  for (const name of critical) {
    const val = process.env[name];
    if (!val || val.trim() === '') {
      errors.push(`${name} is missing or empty`);
    }
  }

  if (process.env.NODE_ENV === 'production') {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY ?? '';
    const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

    if (clerkSecretKey.startsWith('sk_test_')) {
      errors.push('CLERK_SECRET_KEY must use a live Clerk key in production');
    }

    if (clerkPublishableKey.startsWith('pk_test_')) {
      errors.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must use a live Clerk key in production');
    }
  }

  if (process.env.ADMIN_SECRET && process.env.CRON_SECRET && process.env.ADMIN_SECRET === process.env.CRON_SECRET) {
    console.warn('WARNING: ADMIN_SECRET and CRON_SECRET are identical — they should differ')
  }

  if (errors.length > 0) {
    const msg = `Environment validation failed:\n  - ${errors.join('\n  - ')}`;
    console.error(msg);
    throw new Error(msg);
  }
}

function optionalEnv(name: string): string | undefined {
  return process.env[name] ?? undefined;
}

// Export validated env — call at runtime, not at import time
export function getServerEnv() {
  return {
    databaseUrl: requireEnv("DATABASE_URL"),
    dataforSeoLogin: requireEnv("DATAFORSEO_LOGIN"),
    dataforSeoPassword: requireEnv("DATAFORSEO_PASSWORD"),
    googleAdsClientId: optionalEnv("GOOGLE_ADS_CLIENT_ID"),
    googleAdsClientSecret: optionalEnv("GOOGLE_ADS_CLIENT_SECRET"),
    googleAdsRefreshToken: optionalEnv("GOOGLE_ADS_REFRESH_TOKEN"),
    googleAdsDeveloperToken: optionalEnv("GOOGLE_ADS_DEVELOPER_TOKEN"),
    serpapiKey: requireEnv("SERPAPI_KEY"),
    adminSecret: requireEnv("ADMIN_SECRET"),
    cronSecret: requireEnv("CRON_SECRET"),
    ahrefsApiToken: optionalEnv("AHREFS_API_TOKEN"),
    stripeSecretKey: optionalEnv("STRIPE_SECRET_KEY"),
    stripeWebhookSecret: optionalEnv("STRIPE_WEBHOOK_SECRET"),
    stripePriceId: optionalEnv("STRIPE_PRICE_ID"),
  };
}
