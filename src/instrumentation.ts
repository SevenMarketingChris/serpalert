export async function register() {
  // Validate critical env vars on server startup (fail fast)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('@/lib/env')
    validateEnv()
  }
}
