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

  // Use the regular SERP endpoint (organic+paid) instead of paid-only,
  // as the paid-only endpoint can miss ad formats and return empty results
  const response = await fetch(
    'https://api.dataforseo.com/v3/serp/google/organic/live/regular',
    {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ keyword, location_name: location, language_name: 'English', device: 'desktop', depth: 100 }]),
      signal: AbortSignal.timeout(30_000),
    }
  )

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`DataForSEO ${response.status}: ${text.slice(0, 200)}`)
  }

  const data = await response.json()

  // Validate the task completed successfully
  const task = data?.tasks?.[0]
  if (!task) {
    console.error(`DataForSEO: no task returned for "${keyword}"`, JSON.stringify(data).slice(0, 500))
    throw new Error(`DataForSEO: no task returned for "${keyword}"`)
  }

  if (task.status_code !== 20000) {
    console.error(`DataForSEO task error for "${keyword}": ${task.status_code} ${task.status_message}`)
    throw new Error(`DataForSEO task failed: ${task.status_code} ${task.status_message}`)
  }

  const result = task.result?.[0]
  if (!result) {
    console.error(`DataForSEO: no result in task for "${keyword}"`, JSON.stringify(task).slice(0, 500))
    throw new Error(`DataForSEO: no result for "${keyword}"`)
  }

  const items = result.items ?? []
  console.log(`DataForSEO "${keyword}": ${items.length} total items, types: ${[...new Set(items.map((i: DataForSeoItem) => i.type))].join(', ')}`)

  const paidItems = items.filter((i: DataForSeoItem) => i.type === 'paid')
  console.log(`DataForSEO "${keyword}": ${paidItems.length} paid ads found`)

  return paidItems
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
