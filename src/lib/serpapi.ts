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
    console.warn('SERPAPI_KEY not set — cannot detect paid ads')
    return []
  }

  // SerpAPI needs a specific location to return ads reliably
  // "United Kingdom" (country-level) often returns no ads
  // "London, England, United Kingdom" matches how most UK ads are targeted
  const serpLocation = location === 'United Kingdom'
    ? 'London, England, United Kingdom'
    : location

  const params = new URLSearchParams({
    q: keyword,
    location: serpLocation,
    gl: 'uk',
    hl: 'en',
    engine: 'google',
    api_key: apiKey,
  })

  const response = await fetch(`https://serpapi.com/search.json?${params}`, {
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    console.error(`SerpAPI ${response.status}: ${text.slice(0, 200)}`)
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

  console.log(`SerpAPI "${keyword}": ${ads.length} paid ads found`)

  return ads
    .filter(ad => {
      const adDomain = ad.domain ?? (() => {
        try { return new URL(ad.link ?? '').hostname } catch { return '' }
      })()
      return !options.brandDomain || adDomain !== options.brandDomain
    })
    .map((ad, i) => {
      const domain = ad.domain ?? (() => {
        try { return new URL(ad.link ?? '').hostname } catch { return 'unknown' }
      })()
      return {
        domain,
        headline: ad.title ?? null,
        description: ad.description ?? null,
        displayUrl: ad.displayed_link ?? null,
        destinationUrl: ad.link ?? null,
        position: ad.position ?? i + 1,
      }
    })
}
