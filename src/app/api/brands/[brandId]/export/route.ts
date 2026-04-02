import { auth } from '@clerk/nextjs/server'
import { getBrandById, getCompetitorSummaryForBrand } from '@/lib/db/queries'
import { checkIsAdmin, authorizeBrandAccess, checkIsAgencyAdmin } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const isAdmin = await checkIsAdmin()
  const { agencyId: userAgencyId } = await checkIsAgencyAdmin()
  const brand = await getBrandById(brandId)
  if (!brand) {
    return new Response('Not found', { status: 404 })
  }
  try {
    authorizeBrandAccess(brand, userId, isAdmin, userAgencyId)
  } catch {
    return new Response('Not found', { status: 404 })
  }

  const competitors = await getCompetitorSummaryForBrand(brandId)

  const headers = ['Domain', 'Avg Position', 'Count 30d', 'Count Total', 'Keywords', 'First Seen', 'Last Seen']

  function escapeCsv(value: string): string {
    // CSV injection defense: prepend tab to values starting with dangerous chars
    if (/^[=+\-@]/.test(value)) {
      value = '\t' + value
    }
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  const rows = competitors.map((c) => [
    escapeCsv(c.domain),
    escapeCsv(c.avgPosition != null ? String(c.avgPosition) : ''),
    escapeCsv(String(c.recentCount)),
    escapeCsv(String(c.totalCount)),
    escapeCsv(c.keywords.join('; ')),
    escapeCsv(new Date(c.firstSeen).toISOString().split('T')[0]),
    escapeCsv(new Date(c.lastSeen).toISOString().split('T')[0]),
  ])

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

  const date = new Date().toISOString().split('T')[0]
  const brandName = brand.name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="competitors-${brandName}-${date}.csv"`,
    },
  })
}
