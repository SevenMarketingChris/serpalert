'use client'
import { useState } from 'react'
import type { PauseTest } from '@/lib/db/schema'

type Props = {
  brandId: string
  activePauseTest: PauseTest | null
  pastTests: PauseTest[]
}

function fmt(n: number) { return `${Math.round(n * 100)}%` }

function TestResult({ test }: { test: PauseTest }) {
  const baseline = test.baselineExposureRate ? parseFloat(test.baselineExposureRate) : null
  const during = test.duringExposureRate ? parseFloat(test.duringExposureRate) : null
  const started = new Date(test.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const ended = test.endedAt ? new Date(test.endedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null

  if (baseline === null || during === null) return null

  const drop = baseline - during
  const isSignificant = Math.abs(drop) > 0.05

  return (
    <div className="bg-[var(--c-card-secondary)] border border-[var(--c-border)] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-medium text-[var(--c-text-secondary)]">{started} → {ended}</p>
        {test.notes && <p className="text-[11px] text-[var(--c-text-muted)] italic">{test.notes}</p>}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider mb-1">Before pause</p>
          <p className="text-[20px] font-semibold text-[var(--c-text)] tabular-nums">{fmt(baseline)}</p>
          <p className="text-[11px] text-[var(--c-text-muted)]">exposure rate</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider mb-1">During pause</p>
          <p className="text-[20px] font-semibold text-[var(--c-text)] tabular-nums">{fmt(during)}</p>
          <p className="text-[11px] text-[var(--c-text-muted)]">exposure rate</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider mb-1">Verdict</p>
          {!isSignificant ? (
            <>
              <p className="text-[14px] font-semibold text-[#59D499]">No change</p>
              <p className="text-[11px] text-[var(--c-text-muted)]">Competitors stable</p>
            </>
          ) : drop > 0 ? (
            <>
              <p className="text-[14px] font-semibold text-[#59D499]">↓ {fmt(drop)} drop</p>
              <p className="text-[11px] text-[var(--c-text-muted)]">Fewer competitors</p>
            </>
          ) : (
            <>
              <p className="text-[14px] font-semibold text-[#E54D42]">↑ {fmt(Math.abs(drop))} rise</p>
              <p className="text-[11px] text-[var(--c-text-muted)]">More competitors</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function PauseTestTracker({ brandId, activePauseTest, pastTests }: Props) {
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [active, setActive] = useState(activePauseTest)

  const start = async () => {
    setLoading(true)
    const res = await fetch(`/api/brands/${brandId}/pause-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: notes.trim() || undefined }),
    })
    if (res.ok) {
      const { test } = await res.json()
      setActive(test)
      setNotes('')
    }
    setLoading(false)
  }

  const end = async () => {
    setLoading(true)
    await fetch(`/api/brands/${brandId}/pause-test`, { method: 'PATCH' })
    setLoading(false)
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      {/* Active test */}
      {active ? (
        <div className="bg-[#FFB340]/6 border border-[#FFB340]/20 rounded-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FFB340] animate-pulse" />
              <div>
                <p className="text-[13px] font-semibold text-[#FFB340]">Pause test in progress</p>
                <p className="text-[11px] text-[#FFB340]/70 mt-0.5">
                  Started {new Date(active.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {active.baselineExposureRate && ` · Baseline: ${fmt(parseFloat(active.baselineExposureRate))} exposure`}
                </p>
              </div>
            </div>
            <button
              onClick={end}
              disabled={loading}
              className="px-3 py-1.5 bg-[#FFB340]/10 text-[#FFB340] border border-[#FFB340]/20 hover:bg-[#FFB340]/20 text-[12px] font-medium rounded-lg transition-colors disabled:opacity-40"
            >
              {loading ? 'Ending…' : 'End test'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-[11px] font-medium text-[var(--c-text-muted)] uppercase tracking-wider mb-1.5">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Pausing brand campaign for 2 weeks"
              className="w-full bg-[var(--c-card-secondary)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[13px] text-[var(--c-text)] placeholder-[var(--c-text-faint)] focus:outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/20 transition-all"
            />
          </div>
          <button
            onClick={start}
            disabled={loading}
            className="px-4 py-2 bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20 hover:bg-[#FF6B35]/20 text-[13px] font-medium rounded-lg transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            {loading ? 'Starting…' : 'Start pause test'}
          </button>
        </div>
      )}

      {/* Past results */}
      {pastTests.filter(t => t.endedAt).length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-[var(--c-text-muted)] uppercase tracking-wider">Previous Tests</p>
          {pastTests.filter(t => t.endedAt).map(t => (
            <TestResult key={t.id} test={t} />
          ))}
        </div>
      )}

      {!active && pastTests.length === 0 && (
        <p className="text-[12px] text-[var(--c-text-muted)]">
          Start a pause test when you pause the brand campaign. We&apos;ll record the current exposure rate as a baseline and compare it against activity during the pause.
        </p>
      )}
    </div>
  )
}
