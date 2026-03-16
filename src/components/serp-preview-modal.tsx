'use client'
import { useState } from 'react'
import type { CompetitorAd } from '@/lib/db/schema'

export function SerpPreviewModal({ ads, keyword, checkedAt }: {
  ads: CompetitorAd[]
  keyword: string
  checkedAt?: Date
}) {
  const [open, setOpen] = useState(false)
  if (ads.length === 0) return <span className="text-[var(--c-text-faint)] text-[12px]">—</span>

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--c-card-secondary)] hover:bg-[var(--c-border)] border border-[var(--c-border)] text-[11px] text-[var(--c-text-muted)] rounded-md transition-colors"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Preview
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-xl w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E5E5]">
              <div>
                <p className="text-[14px] font-semibold text-[#1D1D1F]">SERP Preview — &ldquo;{keyword}&rdquo;</p>
                {checkedAt && (
                  <p className="text-[11px] text-[#86868B] mt-0.5">
                    {checkedAt.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] transition-colors text-xl leading-none"
              >×</button>
            </div>

            {/* Synthetic Google SERP */}
            <div className="p-5 bg-white">
              {/* Search bar */}
              <div className="flex items-center gap-3 mb-5 border border-[#DFE1E5] rounded-full px-4 py-2 shadow-sm">
                <svg className="w-4 h-4 text-[#9AA0A6] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-[14px] text-[#3C4043] flex-1">{keyword}</span>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="none"/>
                  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" fill="#4285F4"/>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" fill="none"/>
                </svg>
              </div>

              {/* Sponsored label */}
              <p className="text-[11px] text-[#70757A] mb-3 font-medium">Sponsored</p>

              {/* Ads */}
              <div className="space-y-5">
                {ads.map(ad => (
                  <div key={ad.id} className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center px-1 py-px border border-[#70757A]/50 text-[#70757A] text-[10px] rounded">Ad</span>
                      <span className="text-[13px] text-[#202124] truncate">{ad.displayUrl ?? ad.domain}</span>
                    </div>
                    {ad.headline && (
                      <p className="text-[#1A0DAB] text-[18px] leading-snug font-normal">{ad.headline}</p>
                    )}
                    {ad.description && (
                      <p className="text-[#4D5156] text-[13px] leading-relaxed">{ad.description}</p>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-[#9AA0A6] mt-5 pt-3 border-t border-[#F1F3F4]">
                Reconstructed from captured ad data — not a live screenshot
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
