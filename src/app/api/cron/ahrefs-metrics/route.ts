import { NextResponse } from 'next/server'
import { isCronRequest } from '@/lib/auth'
import { getAllActiveBrands, getCompetitorDomainsLastNDays, upsertAhrefsDomainMetrics, replaceTopKeywords } from '@/lib/db/queries'
import { fetchAllMetricsForDomain, fetchTopOrganicKeywords } from '@/lib/ahrefs'
import { acquireLock, releaseLock } from '@/lib/cron-lock'

export const maxDuration = 300

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await acquireLock('ahrefs-metrics'))) {
    return NextResponse.json({ error: 'Already running' }, { status: 409 })
  }

  try {
    const allBrands = await getAllActiveBrands()
    const today = new Date().toISOString().split('T')[0]
    const results = []

    for (const brand of allBrands) {
      if (!brand.domain) continue

      try {
        // Fetch brand's own domain metrics
        const brandMetrics = await fetchAllMetricsForDomain(brand.domain, today)
        if (brandMetrics.domainRating !== null) {
          await upsertAhrefsDomainMetrics({
            brandId: brand.id,
            domain: brand.domain,
            isBrandDomain: true,
            date: today,
            ...brandMetrics,
          })
        }

        // Fetch top keywords for brand domain
        const brandKeywords = await fetchTopOrganicKeywords(brand.domain, today, 10)
        if (brandKeywords.length > 0) {
          await replaceTopKeywords(brand.id, brand.domain, today,
            brandKeywords.map(kw => ({
              keyword: kw.keyword,
              position: kw.best_position,
              volume: kw.volume,
              traffic: kw.sum_traffic,
            }))
          )
        }

        // Fetch competitor domain metrics (last 30 days of detected competitors)
        const competitorDomains = await getCompetitorDomainsLastNDays(brand.id, 30)
        const CONCURRENCY = 2
        for (let i = 0; i < competitorDomains.length; i += CONCURRENCY) {
          const batch = competitorDomains.slice(i, i + CONCURRENCY)
          await Promise.all(batch.map(async (compDomain) => {
            try {
              const compMetrics = await fetchAllMetricsForDomain(compDomain, today)
              if (compMetrics.domainRating !== null) {
                await upsertAhrefsDomainMetrics({
                  brandId: brand.id,
                  domain: compDomain,
                  isBrandDomain: false,
                  date: today,
                  ...compMetrics,
                })
              }
              const compKeywords = await fetchTopOrganicKeywords(compDomain, today, 10)
              if (compKeywords.length > 0) {
                await replaceTopKeywords(brand.id, compDomain, today,
                  compKeywords.map(kw => ({
                    keyword: kw.keyword,
                    position: kw.best_position,
                    volume: kw.volume,
                    traffic: kw.sum_traffic,
                  }))
                )
              }
            } catch (err) {
              console.error(`Ahrefs fetch failed for competitor ${compDomain}:`, err)
            }
          }))
        }

        results.push({ brand: brand.name, status: 'ok', competitors: competitorDomains.length })
      } catch (err) {
        console.error(`Ahrefs metrics failed for ${brand.name}:`, err)
        results.push({ brand: brand.name, status: 'error', error: 'Check failed' })
      }
    }

    return NextResponse.json({ results, timestamp: new Date().toISOString() })
  } finally {
    await releaseLock('ahrefs-metrics')
  }
}
