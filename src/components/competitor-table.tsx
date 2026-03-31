'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

type Competitor = {
  domain: string
  totalCount: number
  recentCount: number
  keywords: string[]
  firstSeen: string
  lastSeen: string
  avgPosition: number | null
  isActive: boolean
}

type AdCopy = {
  headline: string | null
  description: string | null
  displayUrl: string | null
  firstSeen: string
  lastSeen: string
  count: number
}

function getRelativeTime(date: Date | string | null): string {
  if (!date) return 'Never'
  const now = new Date()
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return 'Unknown'
  const diffMs = Math.max(0, now.getTime() - d.getTime())
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function CompetitorTable({
  competitors,
  brandId,
}: {
  competitors: Competitor[]
  brandId: string
}) {
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null)
  const [adCopyCache, setAdCopyCache] = useState<Record<string, AdCopy[]>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [fetchErrors, setFetchErrors] = useState<Record<string, boolean>>({})

  async function toggleRow(domain: string) {
    if (expandedDomain === domain) {
      setExpandedDomain(null)
      return
    }
    setExpandedDomain(domain)
    if (!adCopyCache[domain] || fetchErrors[domain]) {
      setFetchErrors((prev) => ({ ...prev, [domain]: false }))
      setLoading(domain)
      try {
        const res = await fetch(`/api/brands/${brandId}/ad-copy?domain=${encodeURIComponent(domain)}`)
        if (res.ok) {
          const data = await res.json()
          setAdCopyCache((prev) => ({ ...prev, [domain]: data }))
        } else {
          setFetchErrors((prev) => ({ ...prev, [domain]: true }))
        }
      } catch {
        setFetchErrors((prev) => ({ ...prev, [domain]: true }))
      } finally {
        setLoading(null)
      }
    }
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-400 font-mono">
              <th className="px-4 py-3 text-left font-medium w-8"></th>
              <th className="px-4 py-3 text-left font-medium">Domain</th>
              <th className="px-4 py-3 text-left font-medium">Avg Position</th>
              <th className="px-4 py-3 text-left font-medium">Last 30d</th>
              <th className="px-4 py-3 text-left font-medium">Total (90d)</th>
              <th className="px-4 py-3 text-left font-medium">Keywords</th>
              <th className="px-4 py-3 text-left font-medium">First Seen</th>
              <th className="px-4 py-3 text-left font-medium">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((competitor) => {
              const isExpanded = expandedDomain === competitor.domain
              const adCopies = adCopyCache[competitor.domain]
              return (
                <React.Fragment key={competitor.domain}>
                  <tr
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => toggleRow(competitor.domain)}
                  >
                    <td className="px-4 py-3 text-gray-400">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-gray-900">{competitor.domain}</span>
                    </td>
                    <td className="px-4 py-3">
                      {competitor.avgPosition != null ? (
                        <span
                          className={`font-mono text-xs px-2 py-0.5 rounded-full ${
                            competitor.avgPosition <= 2
                              ? 'bg-red-50 text-red-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {competitor.avgPosition}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-sm text-gray-900">
                      {competitor.recentCount}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-500">
                      {competitor.totalCount}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {competitor.keywords.slice(0, 3).map((kw) => (
                          <span
                            key={kw}
                            className="bg-indigo-50 text-indigo-600 text-xs font-mono px-2 py-0.5 rounded"
                          >
                            {kw}
                          </span>
                        ))}
                        {competitor.keywords.length > 3 && (
                          <span className="text-gray-400 text-xs">
                            +{competitor.keywords.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {formatDate(competitor.firstSeen)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {getRelativeTime(competitor.lastSeen)}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-50/50">
                      <td colSpan={8} className="px-8 py-4">
                        {loading === competitor.domain ? (
                          <p className="text-sm text-gray-400">Loading ad copy history...</p>
                        ) : fetchErrors[competitor.domain] ? (
                          <p
                            className="text-sm text-red-500 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); setExpandedDomain(null); setTimeout(() => toggleRow(competitor.domain), 0) }}
                          >
                            Failed to load. Click to retry.
                          </p>
                        ) : adCopies && adCopies.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-mono mb-2">
                              Ad Copy History
                            </p>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">
                                  <th className="text-left pb-2 font-medium">Headline</th>
                                  <th className="text-left pb-2 font-medium">Description</th>
                                  <th className="text-left pb-2 font-medium">Display URL</th>
                                  <th className="text-left pb-2 font-medium">First Seen</th>
                                  <th className="text-left pb-2 font-medium">Last Seen</th>
                                  <th className="text-left pb-2 font-medium">Count</th>
                                </tr>
                              </thead>
                              <tbody>
                                {adCopies.map((ad, i) => (
                                  <tr
                                    key={i}
                                    className="border-t border-gray-100 text-gray-600"
                                  >
                                    <td className="py-2 pr-3 text-gray-800 max-w-[200px] truncate">
                                      {ad.headline || <span className="text-gray-300">&mdash;</span>}
                                    </td>
                                    <td className="py-2 pr-3 max-w-[250px] truncate">
                                      {ad.description || <span className="text-gray-300">&mdash;</span>}
                                    </td>
                                    <td className="py-2 pr-3 font-mono text-xs">
                                      {ad.displayUrl || <span className="text-gray-300">&mdash;</span>}
                                    </td>
                                    <td className="py-2 pr-3 font-mono text-xs text-gray-400">
                                      {formatDate(ad.firstSeen)}
                                    </td>
                                    <td className="py-2 pr-3 font-mono text-xs text-gray-400">
                                      {getRelativeTime(ad.lastSeen)}
                                    </td>
                                    <td className="py-2 font-mono text-xs text-gray-400">
                                      {ad.count}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">No ad copy history found.</p>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {competitors.map((competitor) => {
          const isExpanded = expandedDomain === competitor.domain
          const adCopies = adCopyCache[competitor.domain]
          return (
            <div
              key={competitor.domain}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
            >
              <div
                className="cursor-pointer"
                onClick={() => toggleRow(competitor.domain)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-medium text-gray-900">{competitor.domain}</span>
                  {competitor.avgPosition != null && (
                    <span
                      className={`font-mono text-xs px-2 py-0.5 rounded-full ${
                        competitor.avgPosition <= 2
                          ? 'bg-red-50 text-red-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Pos {competitor.avgPosition}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span>
                    <span className="font-mono font-bold text-gray-900">{competitor.recentCount}</span>{' '}
                    last 30d
                    <span className="mx-1">&middot;</span>
                    <span className="font-mono text-gray-500">{competitor.totalCount}</span> total
                  </span>
                  <span className="font-mono text-xs">{getRelativeTime(competitor.lastSeen)}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {competitor.keywords.slice(0, 3).map((kw) => (
                    <span
                      key={kw}
                      className="bg-indigo-50 text-indigo-600 text-xs font-mono px-2 py-0.5 rounded"
                    >
                      {kw}
                    </span>
                  ))}
                  {competitor.keywords.length > 3 && (
                    <span className="text-gray-400 text-xs">+{competitor.keywords.length - 3}</span>
                  )}
                </div>
              </div>
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {loading === competitor.domain ? (
                    <p className="text-sm text-gray-400">Loading...</p>
                  ) : fetchErrors[competitor.domain] ? (
                    <p
                      className="text-sm text-red-500 cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); setExpandedDomain(null); setTimeout(() => toggleRow(competitor.domain), 0) }}
                    >
                      Failed to load. Click to retry.
                    </p>
                  ) : adCopies && adCopies.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">
                        Ad Copy History
                      </p>
                      {adCopies.map((ad, i) => (
                        <div key={i} className="text-sm space-y-1 border-b border-gray-50 pb-2 last:border-0">
                          <p className="text-gray-800 font-medium truncate">{ad.headline || 'No headline'}</p>
                          <p className="text-gray-500 text-xs truncate">{ad.description || 'No description'}</p>
                          {ad.displayUrl && (
                            <p className="font-mono text-xs text-gray-400">{ad.displayUrl}</p>
                          )}
                          <p className="font-mono text-xs text-gray-400">
                            {formatDate(ad.firstSeen)} &middot; {ad.count}x
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No ad copy history found.</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
