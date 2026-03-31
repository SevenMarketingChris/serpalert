export interface SerpAdResult {
  domain: string
  headline: string | null
  description: string | null
  displayUrl: string | null
  destinationUrl: string | null
  position: number
}

/**
 * Check Google Ads for competitor ads on a brand keyword using SerpAPI.
 * Returns structured ad results. SerpAPI reliably returns paid ads
 * unlike DataForSEO's organic endpoint.
 */
export async function checkSerpForAds(
  keyword: string,
  location = 'United Kingdom',
  options: { brandDomain?: string } = {}
): Promise<SerpAdResult[]> {
  const apiKey = process.env.SERPAPI_KEY
  if (!apiKey) {
    throw new Error('SERPAPI_KEY not set — cannot detect paid ads')
  }

  // SerpAPI needs a specific location to return ads reliably
  // "United Kingdom" (country-level) often returns no ads
  // "London, England, United Kingdom" matches how most UK ads are targeted
  const serpLocation = location === 'United Kingdom'
    ? 'London, England, United Kingdom'
    : location

  // SerpAPI requires api_key as a query parameter — their API does not support header-based auth
  const params = new URLSearchParams({
    q: keyword,
    location: serpLocation,
    gl: 'uk',
    hl: 'en',
    engine: 'google',
    api_key: apiKey,  // Must be in query string per SerpAPI docs
  })

  const response = await fetch(`https://serpapi.com/search.json?${params}`, {
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    const safeText = text.replace(apiKey, '[REDACTED]').slice(0, 200)
    console.error(`SerpAPI ${response.status}: ${safeText}`)
    throw new Error(`SerpAPI failed: ${response.status}`)
  }

  const data = await response.json()
  const ads: Array<{
    position?: number
    title?: string
    description?: string
    displayed_link?: string
    link?: string
    domain?: string
    tracking_link?: string
  }> = data.ads ?? []

  console.info(`SerpAPI "${keyword}": ${ads.length} paid ads found`)

  // Normalize domain: strip www. prefix and lowercase for comparison
  const normalizeDomain = (d: string) => d.toLowerCase().replace(/^www\./, '')

  return ads
    .filter(ad => {
      const adDomain = ad.domain ?? (() => {
        try { return new URL(ad.link ?? '').hostname } catch { return '' }
      })()
      if (!options.brandDomain) return true
      return normalizeDomain(adDomain) !== normalizeDomain(options.brandDomain)
    })
    .map((ad, i) => {
      const rawDomain = ad.domain ?? (() => {
        try { return new URL(ad.link ?? '').hostname } catch { return 'unknown' }
      })()
      return {
        domain: normalizeDomain(rawDomain),
        headline: ad.title ?? null,
        description: ad.description ?? null,
        displayUrl: ad.displayed_link ?? null,
        destinationUrl: ad.link ?? null,
        position: ad.position ?? i + 1,
      }
    })
}
