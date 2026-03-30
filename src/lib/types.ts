export const AD_STATUSES = ['new', 'acknowledged', 'reported', 'resolved'] as const
export type AdStatus = typeof AD_STATUSES[number]

export function isValidAdStatus(status: string): status is AdStatus {
  return AD_STATUSES.includes(status as AdStatus)
}
