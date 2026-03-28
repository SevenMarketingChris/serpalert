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

  const critical = ['DATABASE_URL', 'DATAFORSEO_LOGIN', 'DATAFORSEO_PASSWORD', 'ADMIN_SECRET', 'CRON_SECRET'] as const;
  for (const name of critical) {
    const val = process.env[name];
    if (!val || val.trim() === '') {
      errors.push(`${name} is missing or empty`);
    }
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
    adminSecret: requireEnv("ADMIN_SECRET"),
    cronSecret: requireEnv("CRON_SECRET"),
    chromiumUrl: optionalEnv("CHROMIUM_URL"),
    ahrefsApiToken: optionalEnv("AHREFS_API_TOKEN"),
  };
}
