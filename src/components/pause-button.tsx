'use client'
import { useState } from 'react'

export function PauseButton({ brandId, initialActive }: { brandId: string; initialActive: boolean }) {
  const [active, setActive] = useState(initialActive)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    await fetch(`/api/brands/${brandId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    setActive(!active)
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      role="switch"
      aria-checked={active}
      className="flex items-center gap-2 disabled:opacity-50 group"
    >
      {/* Track */}
      <div className={`relative w-8 h-[18px] rounded-full transition-colors duration-200 ${
        active ? 'bg-[#FF6B35]' : 'bg-[#3A3A3A]'
      }`}>
        {/* Knob */}
        <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
          active ? 'translate-x-[18px]' : 'translate-x-[2px]'
        }`} />
      </div>
      <span className={`text-[12px] font-medium transition-colors ${
        active ? 'text-[#FF6B35]' : 'text-[var(--c-text-muted)]'
      }`}>
        {loading ? '…' : active ? 'Live' : 'Paused'}
      </span>
    </button>
  )
}
