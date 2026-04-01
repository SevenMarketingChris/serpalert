import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getBrandById, getCompetitorSummaryForBrand, getAdCopyHistory } from '@/lib/db/queries'
import { checkIsAdmin, authorizeBrandAccess } from '@/lib/auth'
import { Shield, Download } from 'lucide-react'
import { CompetitorTable } from '@/components/competitor-table'

export default async function CompetitorsPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const isAdmin = await checkIsAdmin()
  const brand = await getBrandById(brandId)
  if (!brand) notFound()
  try {
    authorizeBrandAccess(brand, userId, isAdmin)
  } catch {
    notFound()
  }

  const competitors = await getCompetitorSummaryForBrand(brandId)

  let adCopySuggestion: { headline: string; description: string } | null = null
  if (competitors.length > 0) {
    try {
      const topCompetitor = competitors[0]
      const adCopy = await getAdCopyHistory(brandId, topCompetitor.domain)
      const { generateAdCopySuggestion } = await import('@/lib/ai')
      adCopySuggestion = await generateAdCopySuggestion(
        brand.name,
        adCopy.map(a => a.headline).filter(Boolean) as string[],
        adCopy.map(a => a.description).filter(Boolean) as string[],
        brand.domain,
      )
    } catch { /* AI unavailable */ }
  }

  return (
    <div className="max-w-5xl space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
        <Link href={`/dashboard/${brandId}`} className="hover:text-indigo-600 transition-colors">&larr; Overview</Link>
        <span>/</span>
        <span className="text-gray-600">Competitors</span>
      </div>

      {competitors.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center space-y-3 shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 mx-auto">
            <Shield className="h-6 w-6" />
          </div>
          <p className="font-semibold text-gray-900">No competitors detected yet</p>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            When competitors start bidding on your brand keywords, they&apos;ll appear here with full details including their ad copy, position, and frequency.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Checks run every hour — if your brand is new, check back after the first scan completes.
          </p>
        </div>
      ) : (
        <>
          {/* AI Ad Copy Suggestion */}
          {competitors.length > 0 && adCopySuggestion && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono">AI Suggested Brand Ad</p>
              <p className="text-sm font-semibold text-indigo-900">Headline: {adCopySuggestion.headline}</p>
              <p className="text-sm text-indigo-700">Description: {adCopySuggestion.description}</p>
              <p className="text-[11px] text-indigo-400">Based on competitor ad copy analysis. Use this in your Google Ads brand campaign.</p>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Competitors</h1>
              <p className="text-sm text-gray-500">
                {competitors.length} competitor{competitors.length !== 1 ? 's' : ''} detected in last 90 days
              </p>
            </div>
            <a
              href={`/api/brands/${brandId}/export`}
              className="inline-flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </a>
          </div>

          {/* Table */}
          <CompetitorTable
            competitors={competitors.map((c) => ({
              ...c,
              firstSeen: c.firstSeen.toISOString(),
              lastSeen: c.lastSeen.toISOString(),
            }))}
            brandId={brandId}
          />
        </>
      )}
    </div>
  )
}
