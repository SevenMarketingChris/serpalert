'use client'

interface StatusFilterProps {
  value: string
  onChange: (value: string) => void
}

const filters = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'unresolved', label: 'Unresolved' },
  { key: 'resolved', label: 'Resolved' },
] as const

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div className="flex flex-row gap-2">
      {filters.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`px-3 py-1 rounded-full text-xs font-mono cursor-pointer transition-colors ${
            value === f.key
              ? 'bg-primary/10 text-primary border-primary/30 font-semibold border'
              : 'bg-card border border-edge text-muted-foreground hover:bg-card/80'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
