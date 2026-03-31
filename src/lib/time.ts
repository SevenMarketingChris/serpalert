export function getRelativeTime(date: Date | string | null): string {
  if (!date) return 'Never'
  const now = new Date()
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return 'Unknown'
  const diffMs = Math.max(0, now.getTime() - d.getTime())
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export function toUTCDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}
