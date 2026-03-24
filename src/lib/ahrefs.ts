import { getServerEnv } from '@/lib/env'

const BASE_URL = 'https://api.ahrefs.com/v3'

async function ahrefsFetch<T>(path: string, params: Record<string, string | number>): Promise<T | null> {
  const env = getServerEnv()
  if (!env.ahrefsApiToken) return null

  const url = new URL(`${BASE_URL}${path}`)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v))
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${env.ahrefsApiToken}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) {
      console.error(`Ahrefs API ${res.status} for ${path}:`, await res.text().catch(() => ''))
      return null
    }
    return await res.json()
  } catch (err) {
    console.error(`Ahrefs API error for ${path}:`, err)
    return null
  }
}

export interface DomainRatingResult {
  domain_rating: number
  ahrefs_rank: number | null
}

export interface SiteMetricsResult {
  org_keywords: number
  org_traffic: number
  org_cost: number | null
  paid_keywords: number
  paid_traffic: number
}

export interface BacklinksStatsResult {
  live: number
  all_time: number
  live_refdomains: number
  all_time_refdomains: number
}

export interface OrganicKeywordResult {
  keyword: string
  best_position: number | null
  volume: number | null
  sum_traffic: number | null
}

export async function fetchDomainRating(domain: string, date: string) {
  return ahrefsFetch<DomainRatingResult>('/site-explorer/domain-rating', {
    target: domain,
    date,
    output: 'json',
  })
}

export async function fetchSiteMetrics(domain: string, date: string) {
  return ahrefsFetch<SiteMetricsResult>('/site-explorer/metrics', {
    target: domain,
    date,
    mode: 'subdomains',
    output: 'json',
  })
}

export async function fetchBacklinksStats(domain: string, date: string) {
  return ahrefsFetch<BacklinksStatsResult>('/site-explorer/backlinks-stats', {
    target: domain,
    date,
    mode: 'subdomains',
    output: 'json',
  })
}

export async function fetchTopOrganicKeywords(domain: string, date: string, limit = 10) {
  type Response = { keywords: OrganicKeywordResult[] }
  const result = await ahrefsFetch<Response>('/site-explorer/organic-keywords', {
    target: domain,
    date,
    mode: 'subdomains',
    select: 'keyword,best_position,volume,sum_traffic',
    order_by: 'sum_traffic:desc',
    limit,
    country: 'gb',
    output: 'json',
  })
  return result?.keywords ?? []
}

export async function fetchAllMetricsForDomain(domain: string, date: string) {
  const [dr, metrics, backlinks] = await Promise.all([
    fetchDomainRating(domain, date),
    fetchSiteMetrics(domain, date),
    fetchBacklinksStats(domain, date),
  ])

  return {
    domainRating: dr?.domain_rating?.toString() ?? null,
    organicTraffic: metrics?.org_traffic ?? null,
    organicKeywords: metrics?.org_keywords ?? null,
    referringDomains: backlinks?.live_refdomains ?? null,
    backlinks: backlinks?.live ?? null,
  }
}
