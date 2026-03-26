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

  const required = ['AUTH_SECRET', 'AUTH_GOOGLE_ID', 'AUTH_GOOGLE_SECRET', 'DATABASE_URL'] as const;
  for (const name of required) {
    const val = process.env[name];
    if (!val || val.trim() === '') {
      errors.push(`${name} is missing or empty`);
    }
  }

  const authSecret = process.env.AUTH_SECRET;
  if (authSecret && authSecret.length < 32) {
    errors.push(`AUTH_SECRET must be at least 32 characters (got ${authSecret.length})`);
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
    googleAdsClientSecret: requireEnv("GOOGLE_ADS_CLIENT_SECRET"),
    googleAdsRefreshToken: requireEnv("GOOGLE_ADS_REFRESH_TOKEN"),
    googleAdsDeveloperToken: requireEnv("GOOGLE_ADS_DEVELOPER_TOKEN"),
    adminSecret: requireEnv("ADMIN_SECRET"),
    cronSecret: requireEnv("CRON_SECRET"),
    adminEmails: requireEnvList("ADMIN_EMAILS"),
    chromiumUrl: optionalEnv("CHROMIUM_URL"),
    ahrefsApiToken: optionalEnv("AHREFS_API_TOKEN"),
    authSecret: requireEnv("AUTH_SECRET"),
    authGoogleId: requireEnv("AUTH_GOOGLE_ID"),
    authGoogleSecret: requireEnv("AUTH_GOOGLE_SECRET"),
  };
}
