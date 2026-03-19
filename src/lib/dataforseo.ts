export interface SerpAdResult {
  domain: string
  headline: string | null
  description: string | null
  displayUrl: string | null
  destinationUrl: string | null
  position: number
}

interface DataForSeoItem {
  type: string
  domain?: string
  title?: string
  description?: string
  breadcrumb?: string
  url?: string
  rank_absolute?: number
}

export async function checkSerpForBrand(
  keyword: string,
  location = 'United Kingdom',
  options: { brandDomain?: string } = {}
): Promise<SerpAdResult[]> {
  if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
    throw new Error('Missing DataForSEO credentials: DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD required')
  }

  const credentials = Buffer.from(
    `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`
  ).toString('base64')

  const response = await fetch(
    'https://api.dataforseo.com/v3/serp/google/paid/live/regular',
    {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ keyword, location_name: location, language_name: 'English', device: 'desktop', depth: 10 }]),
    }
  )

  if (!response.ok) throw new Error(`DataForSEO ${response.status}`)

  const data = await response.json()
  const items = data?.tasks?.[0]?.result?.[0]?.items ?? []

  return items
    .filter((i: DataForSeoItem) => i.type === 'paid')
    .filter((i: DataForSeoItem) => !options.brandDomain || i.domain !== options.brandDomain)
    .map((i: DataForSeoItem) => ({
      domain: i.domain ?? new URL(i.url ?? 'https://unknown').hostname,
      headline: i.title ?? null,
      description: i.description ?? null,
      displayUrl: i.breadcrumb ?? null,
      destinationUrl: i.url ?? null,
      position: i.rank_absolute ?? 0,
    }))
}
