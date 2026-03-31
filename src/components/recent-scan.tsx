'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { ScanRun } from '@/lib/group-checks'
import { isSafeUrl } from '@/lib/utils'

interface RecentScanProps {
  run: ScanRun
}

function formatScanTime(date: string): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
    ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function RecentScan({ run }: RecentScanProps) {
  const [expandedImg, setExpandedImg] = useState<string | null>(null)

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Latest Scan</h3>
          <span className="text-xs text-gray-400 font-mono">{formatScanTime(run.timestamp)}</span>
        </div>
        <div className="divide-y divide-gray-100">
          {run.checks.map(check => {
            const hasThreat = check.competitorCount > 0
            const domains = check.ads.map(a => a.domain)
            const uniqueDomains = [...new Set(domains)]

            return (
              <div key={check.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
                <span className="bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5 text-xs font-mono">
                  {check.keyword}
                </span>
                {hasThreat ? (
                  <span className="text-xs text-red-600 font-mono">
                    {uniqueDomains.join(', ')}
                  </span>
                ) : (
                  <span className="text-xs text-emerald-600 font-mono">Clear</span>
                )}
                {check.screenshotUrl && isSafeUrl(check.screenshotUrl) && (
                  <button
                    onClick={() => setExpandedImg(check.screenshotUrl)}
                    className="ml-auto relative w-20 h-[60px] rounded border border-gray-200 overflow-hidden hover:opacity-80 transition-opacity shrink-0 bg-gray-50"
                  >
                    <Image
                      src={check.screenshotUrl}
                      alt={`SERP for "${check.keyword}"`}
                      fill
                      className="object-cover object-top"
                      sizes="80px"
                    />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Expanded screenshot overlay */}
      {expandedImg && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setExpandedImg(null)}
        >
          <div className="relative max-w-3xl max-h-[80vh] w-full">
            <Image
              src={expandedImg}
              alt="SERP screenshot"
              width={1200}
              height={800}
              className="rounded-lg object-contain w-full h-auto max-h-[80vh]"
            />
          </div>
        </div>
      )}
    </>
  )
}
