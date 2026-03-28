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

function getCredentials(): string {
  if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
    throw new Error('Missing DataForSEO credentials: DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD required')
  }
  return Buffer.from(
    `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`
  ).toString('base64')
}

interface FetchSerpResult {
  items: DataForSeoItem[]
  taskId: string | null
}

async function fetchSerp(
  endpoint: string,
  keyword: string,
  location: string,
  depth: number
): Promise<FetchSerpResult> {
  const credentials = getCredentials()

  const response = await fetch(
    `https://api.dataforseo.com/v3/serp/google/${endpoint}/live/regular`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ keyword, location_name: location, language_name: 'English', device: 'desktop', depth }]),
      signal: AbortSignal.timeout(30_000),
    }
  )

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`DataForSEO ${response.status}: ${text.slice(0, 200)}`)
  }

  const data = await response.json()

  const task = data?.tasks?.[0]
  if (!task) {
    console.error(`DataForSEO [${endpoint}]: no task returned for "${keyword}"`, JSON.stringify(data).slice(0, 500))
    throw new Error(`DataForSEO: no task returned for "${keyword}"`)
  }

  if (task.status_code !== 20000) {
    console.error(`DataForSEO [${endpoint}] task error for "${keyword}": ${task.status_code} ${task.status_message}`)
    throw new Error(`DataForSEO task failed: ${task.status_code} ${task.status_message}`)
  }

  const taskId: string | null = task.id ?? null

  const result = task.result?.[0]
  if (!result) {
    console.warn(`DataForSEO [${endpoint}]: no result for "${keyword}" (may have no data)`)
    return { items: [], taskId }
  }

  const items: DataForSeoItem[] = result.items ?? []
  const types = [...new Set(items.map((i) => i.type))].join(', ')
  console.log(`DataForSEO [${endpoint}] "${keyword}": ${items.length} items, types: ${types}`)
  return { items, taskId }
}

export interface SerpCheckResult {
  ads: SerpAdResult[]
  taskId: string | null
}

export async function checkSerpForBrand(
  keyword: string,
  location = 'United Kingdom',
  options: { brandDomain?: string } = {}
): Promise<SerpCheckResult> {
  let paidItems: DataForSeoItem[] = []
  let taskId: string | null = null

  try {
    const result = await fetchSerp('organic', keyword, location, 100)
    taskId = result.taskId
    paidItems = result.items.filter((i) =>
      i.type === 'paid' || i.type === 'ads' || i.type === 'shopping' ||
      i.type === 'paid_box' || i.type === 'top_stories_paid'
    )
    console.log(`DataForSEO "${keyword}": ${paidItems.length} paid/ad items found`)
    if (paidItems.length === 0) {
      console.log(`DataForSEO "${keyword}": no paid ads detected at this time`)
    }
  } catch (err) {
    console.error(`DataForSEO failed for "${keyword}":`, err)
  }

  const ads = paidItems
    .filter((i) => !options.brandDomain || i.domain !== options.brandDomain)
    .map((i) => ({
      domain: i.domain ?? (() => { try { return new URL(i.url ?? '').hostname } catch { return 'unknown' } })(),
      headline: i.title ?? null,
      description: i.description ?? null,
      displayUrl: i.breadcrumb ?? null,
      destinationUrl: i.url ?? null,
      position: i.rank_absolute ?? 0,
    }))

  return { ads, taskId }
}
