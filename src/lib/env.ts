function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
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
    allowedEmails: requireEnvList("ALLOWED_EMAILS"),
    adminEmails: requireEnvList("ADMIN_EMAILS"),
    chromiumUrl: optionalEnv("CHROMIUM_URL"),
    authSecret: requireEnv("AUTH_SECRET"),
    authGoogleId: optionalEnv("AUTH_GOOGLE_ID"),
    authGoogleSecret: optionalEnv("AUTH_GOOGLE_SECRET"),
  };
}
