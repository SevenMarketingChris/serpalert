'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const COOLDOWN_MS = 4 * 60 * 60 * 1000 // 4 hours

interface Props {
  brandId: string
  lastCheckAt: string | null // ISO string
}

function formatWait(ms: number): string {
  if (ms <= 0) return ''
  const totalMins = Math.ceil(ms / 60_000)
  const hours = Math.floor(totalMins / 60)
  const mins = totalMins % 60
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export function ManualCheckButton({ brandId, lastCheckAt }: Props) {
  const inFlight = useRef(false)
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<string>('')
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null)
  const [remaining, setRemaining] = useState<string>('')

  // Calculate initial cooldown from last check
  const recalcCooldown = useCallback(() => {
    if (!lastCheckAt) return
    const lastTime = new Date(lastCheckAt).getTime()
    const end = lastTime + COOLDOWN_MS
    if (end > Date.now()) {
      setCooldownEnd(end)
    }
  }, [lastCheckAt])

  useEffect(() => {
    recalcCooldown()
  }, [recalcCooldown])

  // Countdown timer
  useEffect(() => {
    if (!cooldownEnd) {
      setRemaining('')
      return
    }

    function tick() {
      const diff = (cooldownEnd ?? 0) - Date.now()
      if (diff <= 0) {
        setCooldownEnd(null)
        setRemaining('')
      } else {
        setRemaining(formatWait(diff))
      }
    }

    tick()
    const interval = setInterval(tick, 30_000) // update every 30s
    return () => clearInterval(interval)
  }, [cooldownEnd])

  const onCooldown = cooldownEnd !== null && cooldownEnd > Date.now()

  async function handleCheck() {
    if (inFlight.current) return
    inFlight.current = true
    setStatus('running')
    setResult('')
    try {
      const res = await fetch(`/api/brands/${brandId}/check`, { method: 'POST' })
      const data = await res.json()

      if (res.status === 429) {
        setStatus('error')
        setResult(data.error || 'Rate limited')
        if (data.cooldownMs) {
          setCooldownEnd(Date.now() + data.cooldownMs)
        }
        inFlight.current = false
        return
      }

      if (!res.ok) {
        setStatus('error')
        setResult(data.error || 'Check failed')
        inFlight.current = false
        return
      }

      const total = data.results.length
      const competitors = data.results.reduce(
        (sum: number, r: { competitorCount?: number }) => sum + (r.competitorCount ?? 0),
        0
      )
      setStatus('done')
      inFlight.current = false
      setResult(
        `Checked ${total} keyword${total !== 1 ? 's' : ''} — ${competitors} competitor${competitors !== 1 ? 's' : ''} found`
      )
      // Set cooldown from now
      setCooldownEnd(Date.now() + COOLDOWN_MS)
      // Refresh page after short delay
      setTimeout(() => window.location.reload(), 2000)
    } catch {
      setStatus('error')
      setResult('Network error')
      inFlight.current = false
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-3">
        <button
          onClick={handleCheck}
          disabled={status === 'running' || onCooldown}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-mono text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm"
        >
          {status === 'running' ? (
            <>
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Checking...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
              {onCooldown ? 'On Cooldown' : 'Run Check Now'}
            </>
          )}
        </button>
      </div>

      {/* Status / cooldown info */}
      {onCooldown && !result && (
        <p className="text-[11px] text-gray-400 font-mono">
          Next check in {remaining}
        </p>
      )}
      {result && (
        <p className={`text-[11px] font-mono ${status === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>
          {result}
        </p>
      )}
    </div>
  )
}
