'use client'
import { useState } from 'react'

export function ScreenshotModal({ screenshotUrl, keyword, checkedAt }: {
  screenshotUrl: string | null
  keyword: string
  checkedAt?: Date
}) {
  const [open, setOpen] = useState(false)
  if (!screenshotUrl) return <span className="text-[var(--c-text-faint)] text-[12px]">—</span>

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative block w-24 h-16 rounded-lg overflow-hidden border border-[var(--c-border)] hover:border-[#FF6B35]/40 transition-all"
      >
        <img src={screenshotUrl} alt={keyword} className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-[11px] font-medium">View</span>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl overflow-hidden max-w-4xl w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--c-border)]">
              <div>
                <p className="text-[14px] font-semibold text-[var(--c-text)]">{keyword}</p>
                {checkedAt && (
                  <p className="text-[12px] text-[var(--c-text-muted)] mt-0.5">
                    {checkedAt.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-6 h-6 rounded-md bg-[var(--c-card-secondary)] flex items-center justify-center text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition-colors text-base leading-none"
              >×</button>
            </div>
            <div className="overflow-auto max-h-[70vh]">
              <img src={screenshotUrl} alt={keyword} className="w-full" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
