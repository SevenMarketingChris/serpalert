import type { CompetitorProfile } from './db/queries'

export type ThreatLevel = 'critical' | 'active' | 'monitoring' | 'low'

export type ThreatScore = {
  score: number        // 0–10
  level: ThreatLevel
  label: string        // human readable
  color: string        // hex for UI
  isEscalating: boolean
  factors: {
    exposure: number   // 0–3: how often they appear vs total scans
    recency: number    // 0–3: how recently they were seen
    breadth: number    // 0–2: how many brand keywords they target
    trend: number      // 0–2: escalating vs declining
  }
}

/**
 * @param profile - competitor profile with appearance counts
 * @param totalChecks30d - total scans run in the last 30 days for this brand
 * @param totalKeywords - total number of keywords being monitored for this brand
 */
export function computeThreatScore(
  profile: CompetitorProfile,
  totalChecks30d: number,
  totalKeywords: number,
): ThreatScore {
  // --- Exposure rate (0–3 points) ---
  // How often do they appear out of all scans?
  const exposureRate = totalChecks30d > 0 ? profile.totalAppearances / totalChecks30d : 0
  let exposure = 0
  if (exposureRate >= 0.35) exposure = 3
  else if (exposureRate >= 0.15) exposure = 2
  else if (exposureRate >= 0.05) exposure = 1

  // --- Recency (0–3 points) ---
  // When did we last see them?
  const daysSinceLastSeen = Math.floor((Date.now() - profile.lastSeen.getTime()) / (1000 * 60 * 60 * 24))
  let recency = 0
  if (daysSinceLastSeen === 0) recency = 3
  else if (daysSinceLastSeen <= 3) recency = 3
  else if (daysSinceLastSeen <= 7) recency = 2
  else if (daysSinceLastSeen <= 30) recency = 1

  // --- Keyword breadth (0–2 points) ---
  // Are they targeting all our brand terms or just one?
  const breadthRatio = totalKeywords > 0 ? profile.uniqueKeywords.length / totalKeywords : 0
  let breadth = 0
  if (breadthRatio >= 1.0) breadth = 2
  else if (breadthRatio >= 0.5) breadth = 1

  // --- Escalation trend (0–2 points) ---
  // Are they appearing more in the last 7 days than the 7 days before?
  // If prior === 0 and recent > 0, they're newly active — treat as high escalation
  let trend = 0
  let isEscalating = false
  if (profile.priorAppearances === 0 && profile.recentAppearances > 0) {
    // Newly active this week — significant escalation
    trend = 2
    isEscalating = true
  } else if (profile.priorAppearances > 0) {
    const trendRatio = profile.recentAppearances / profile.priorAppearances
    if (trendRatio >= 2) { trend = 2; isEscalating = true }
    else if (trendRatio >= 1.25) { trend = 1; isEscalating = true }
  }

  const score = exposure + recency + breadth + trend

  let level: ThreatLevel
  let label: string
  let color: string
  if (score >= 8) {
    level = 'critical'; label = 'Critical'; color = '#E54D42'
  } else if (score >= 5) {
    level = 'active'; label = 'Active'; color = '#FFB340'
  } else if (score >= 2) {
    level = 'monitoring'; label = 'Monitoring'; color = '#636360'
  } else {
    level = 'low'; label = 'Low'; color = '#3D3D3D'
  }

  return { score, level, label, color, isEscalating, factors: { exposure, recency, breadth, trend } }
}

export function getThreatDot(level: ThreatLevel): string {
  switch (level) {
    case 'critical': return '#E54D42'
    case 'active': return '#FFB340'
    case 'monitoring': return '#636360'
    case 'low': return '#3D3D3D'
  }
}
