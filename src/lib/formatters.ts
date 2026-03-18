/** Format a numeric value as GBP currency (accepts string or number from DB) */
export function formatGBP(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

/** Format a ROAS numeric value to 2 decimal places */
export function formatRoas(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—'
  return `${Number(value).toFixed(2)}x`
}

/** Format a percentage (0–1 or 0–100 handled) */
export function formatPercent(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—'
  const n = Number(value)
  const pct = n > 1 ? n : n * 100
  return `${pct.toFixed(1)}%`
}
