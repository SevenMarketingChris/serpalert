/**
 * Get the current hour in UK time (handles BST/GMT automatically).
 * Uses Intl API which is available in Node.js and browsers.
 */
export function getUKHour(): number {
  const now = new Date()
  const ukTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: 'numeric',
    hour12: false,
  }).format(now)
  return parseInt(ukTime, 10)
}

/**
 * Check if the current UK time matches the target hour.
 * Use this in crons to ensure they run at the right UK local time
 * regardless of BST/GMT.
 */
export function isUKHour(targetHour: number): boolean {
  return getUKHour() === targetHour
}
