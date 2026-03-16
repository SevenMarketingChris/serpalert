'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RunCheckButton({ brandId }: { brandId: string }) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const router = useRouter()

  const run = async () => {
    setStatus('running')
    try {
      const res = await fetch('/api/run-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId }),
      })
      if (res.ok) {
        setStatus('done')
        router.refresh()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
    setTimeout(() => setStatus('idle'), 5000)
  }

  return (
    <button
      onClick={run}
      disabled={status === 'running'}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium bg-[#FF6B35]/10 text-[#FF6B35] hover:bg-[#FF6B35]/20 border border-[#FF6B35]/20 transition-colors disabled:opacity-50"
    >
      {status === 'running' && (
        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a8 8 0 11-8 8z"/>
        </svg>
      )}
      {status === 'idle' && 'Run check now'}
      {status === 'running' && 'Checking…'}
      {status === 'done' && '✓ Done'}
      {status === 'error' && 'Error — retry'}
    </button>
  )
}
