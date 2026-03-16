export function getLogoUrl(websiteUrl: string | null): string | null {
  if (!websiteUrl) return null
  try {
    const domain = new URL(websiteUrl).hostname.replace(/^www\./, '')
    return `https://logo.clearbit.com/${domain}`
  } catch {
    return null
  }
}
