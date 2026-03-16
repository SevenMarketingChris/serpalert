'use client'
import { useState } from 'react'

export function BrandEnricher({ brandId, hasWebsite }: { brandId: string; hasWebsite: boolean }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ logoUrl?: string | null; description?: string | null } | null>(null)

  if (!hasWebsite) return null

  const enrich = async () => {
    setStatus('loading')
    try {
      const res = await fetch(`/api/brands/${brandId}/enrich`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        return
      }
      setResult(data.info)
      setStatus('done')
      // Reload to show updated data
      setTimeout(() => window.location.reload(), 1200)
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={enrich}
        disabled={status === 'loading' || status === 'done'}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg border transition-colors disabled:opacity-50"
        style={{
          background: 'var(--c-card-secondary)',
          borderColor: 'var(--c-border)',
          color: status === 'done' ? '#59D499' : 'var(--c-text-muted)',
        }}
      >
        {status === 'loading' ? (
          <>
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Scanning site…
          </>
        ) : status === 'done' ? (
          <>✓ Profile updated</>
        ) : status === 'error' ? (
          <>Failed — retry?</>
        ) : (
          <>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Pull site info
          </>
        )}
      </button>
      {status === 'error' && (
        <span className="text-[11px] text-[#E54D42]">Couldn&apos;t reach the site</span>
      )}
    </div>
  )
}
