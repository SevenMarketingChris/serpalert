function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/**
 * Validate critical env vars at startup (fail fast).
 * Import this in the root layout or instrumentation file.
 */
export function validateEnv(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical — app cannot function without these
  const critical = ['DATABASE_URL', 'AUTH_SECRET'] as const;
  for (const name of critical) {
    const val = process.env[name];
    if (!val || val.trim() === '') {
      errors.push(`${name} is missing or empty`);
    }
  }

  const authSecret = process.env.AUTH_SECRET;
  if (authSecret && authSecret.length < 32) {
    errors.push(`AUTH_SECRET must be at least 32 characters (got ${authSecret.length})`);
  }

  // Optional — Google OAuth won't work without these, but cron/health/admin still will
  const optional = ['AUTH_GOOGLE_ID', 'AUTH_GOOGLE_SECRET'] as const;
  for (const name of optional) {
    const val = process.env[name];
    if (!val || val.trim() === '') {
      warnings.push(`${name} is missing — Google OAuth login will be disabled`);
    }
  }

  if (warnings.length > 0) {
    console.warn(`Environment warnings:\n  - ${warnings.join('\n  - ')}`);
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

function requireEnvList(name: string): string[] {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

// Export validated env — call at runtime, not at import time
export function getServerEnv() {
  return {
    databaseUrl: requireEnv("DATABASE_URL"),
    supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    dataforSeoLogin: requireEnv("DATAFORSEO_LOGIN"),
    dataforSeoPassword: requireEnv("DATAFORSEO_PASSWORD"),
    googleAdsClientId: requireEnv("GOOGLE_ADS_CLIENT_ID"),
    googleAdsClientSecret: optionalEnv("GOOGLE_ADS_CLIENT_SECRET"),
    googleAdsRefreshToken: requireEnv("GOOGLE_ADS_REFRESH_TOKEN"),
    googleAdsDeveloperToken: requireEnv("GOOGLE_ADS_DEVELOPER_TOKEN"),
    adminSecret: requireEnv("ADMIN_SECRET"),
    cronSecret: requireEnv("CRON_SECRET"),
    adminEmails: optionalEnv("ADMIN_EMAILS")?.split(",").map(s => s.trim()).filter(Boolean) ?? [],
    chromiumUrl: optionalEnv("CHROMIUM_URL"),
    ahrefsApiToken: optionalEnv("AHREFS_API_TOKEN"),
    authSecret: requireEnv("AUTH_SECRET"),
    authGoogleId: optionalEnv("AUTH_GOOGLE_ID"),
    authGoogleSecret: optionalEnv("AUTH_GOOGLE_SECRET"),
  };
}
