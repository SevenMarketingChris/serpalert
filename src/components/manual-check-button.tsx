'use client'

import { useState } from 'react'

export function ManualCheckButton({ brandId }: { brandId: string }) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<string>('')

  async function handleCheck() {
    setStatus('running')
    setResult('')
    try {
      const res = await fetch(`/api/brands/${brandId}/check`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setResult(data.error || 'Check failed')
        return
      }
      const total = data.results.length
      const competitors = data.results.reduce((sum: number, r: { competitorCount?: number }) => sum + (r.competitorCount ?? 0), 0)
      setStatus('done')
      setResult(`Checked ${total} keyword${total !== 1 ? 's' : ''} — ${competitors} competitor ad${competitors !== 1 ? 's' : ''} found`)
      // Refresh page after short delay to show new data
      setTimeout(() => window.location.reload(), 2000)
    } catch {
      setStatus('error')
      setResult('Network error')
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleCheck}
        disabled={status === 'running'}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-mono hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'running' ? (
          <>
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Checking…
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
            Run Check Now
          </>
        )}
      </button>
      {result && (
        <span className={`text-xs font-mono ${status === 'error' ? 'text-red-500' : 'text-tech-green'}`}>
          {result}
        </span>
      )}
    </div>
  )
}
