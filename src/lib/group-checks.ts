export interface CheckItem {
  id: string
  keyword: string
  checkedAt: string
  competitorCount: number
  screenshotUrl: string | null
  ads: {
    id: string
    domain: string
    headline: string | null
    description: string | null
    displayUrl: string | null
    position: number | null
    status: string
  }[]
}

export interface ScanRun {
  timestamp: string
  checks: CheckItem[]
  totalKeywords: number
  totalThreats: number
  screenshotCount: number
  hasUnresolved: boolean
}

export function groupChecksIntoRuns(checks: CheckItem[]): ScanRun[] {
  if (checks.length === 0) return []

  const runs: ScanRun[] = []
  let currentRun: CheckItem[] = [checks[0]]

  for (let i = 1; i < checks.length; i++) {
    const prev = new Date(checks[i - 1].checkedAt).getTime()
    const curr = new Date(checks[i].checkedAt).getTime()
    const diffMs = Math.abs(prev - curr)

    if (diffMs <= 5 * 60 * 1000) {
      currentRun.push(checks[i])
    } else {
      runs.push(buildRun(currentRun))
      currentRun = [checks[i]]
    }
  }

  runs.push(buildRun(currentRun))
  return runs
}

function buildRun(checks: CheckItem[]): ScanRun {
  return {
    timestamp: checks[0].checkedAt,
    checks,
    totalKeywords: checks.length,
    totalThreats: checks.reduce((sum, c) => sum + c.competitorCount, 0),
    screenshotCount: checks.filter(c => c.screenshotUrl).length,
    hasUnresolved: checks.some(c =>
      c.ads.some(a => ['new', 'acknowledged', 'reported'].includes(a.status))
    ),
  }
}
