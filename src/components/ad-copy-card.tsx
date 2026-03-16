import type { CompetitorAd } from '@/lib/db/schema'

export function AdCopyCard({ ads }: { ads: CompetitorAd[] }) {
  if (ads.length === 0) return null
  return (
    <div className="space-y-1.5">
      {ads.map(ad => (
        <div key={ad.id} className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-flex items-center px-1 py-px bg-[#E54D42]/15 text-[#E54D42] text-[9px] font-semibold rounded uppercase tracking-wider">Ad</span>
            <span className="text-[var(--c-text-muted)] text-[11px] truncate">{ad.displayUrl ?? ad.domain}</span>
          </div>
          {ad.headline && <p className="text-[var(--c-text)] text-[12px] font-medium leading-snug mb-0.5">{ad.headline}</p>}
          {ad.description && <p className="text-[var(--c-text-secondary)] text-[11px] leading-snug">{ad.description}</p>}
        </div>
      ))}
    </div>
  )
}
