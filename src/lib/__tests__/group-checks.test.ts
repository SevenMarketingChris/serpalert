import { describe, it, expect } from 'vitest'
import { groupChecksIntoRuns, type CheckItem } from '../group-checks'

function makeCheck(id: string, checkedAt: string, competitorCount = 0): CheckItem {
  return {
    id,
    keyword: 'test',
    checkedAt,
    competitorCount,
    screenshotUrl: null,
    ads: [],
  }
}

describe('groupChecksIntoRuns', () => {
  it('returns empty array for empty input', () => {
    expect(groupChecksIntoRuns([])).toEqual([])
  })

  it('groups checks within 5 minutes into one run', () => {
    const checks = [
      makeCheck('1', '2026-03-28T08:00:00Z'),
      makeCheck('2', '2026-03-28T08:01:00Z'),
      makeCheck('3', '2026-03-28T08:02:00Z'),
    ]
    const runs = groupChecksIntoRuns(checks)
    expect(runs).toHaveLength(1)
    expect(runs[0].totalKeywords).toBe(3)
  })

  it('splits checks more than 5 minutes apart into separate runs', () => {
    const checks = [
      makeCheck('1', '2026-03-28T08:00:00Z'),
      makeCheck('2', '2026-03-28T08:01:00Z'),
      makeCheck('3', '2026-03-28T09:00:00Z'),
    ]
    const runs = groupChecksIntoRuns(checks)
    expect(runs).toHaveLength(2)
    expect(runs[0].totalKeywords).toBe(1)
    expect(runs[1].totalKeywords).toBe(2)
  })

  it('counts unique competitor domains, not ad rows', () => {
    const checks: CheckItem[] = [
      {
        id: '1',
        keyword: 'brand',
        checkedAt: '2026-03-28T08:00:00Z',
        competitorCount: 2,
        screenshotUrl: null,
        ads: [
          { id: 'a1', domain: 'rival.com', headline: 'Ad 1', description: null, displayUrl: null, destinationUrl: null, position: 1, status: 'new' },
          { id: 'a2', domain: 'rival.com', headline: 'Ad 2', description: null, displayUrl: null, destinationUrl: null, position: 2, status: 'new' },
        ],
      },
      {
        id: '2',
        keyword: 'brand uk',
        checkedAt: '2026-03-28T08:01:00Z',
        competitorCount: 1,
        screenshotUrl: null,
        ads: [
          { id: 'a3', domain: 'rival.com', headline: 'Ad 3', description: null, displayUrl: null, destinationUrl: null, position: 1, status: 'new' },
        ],
      },
    ]
    const runs = groupChecksIntoRuns(checks)
    expect(runs).toHaveLength(1)
    // Should be 1 unique domain (rival.com), not 3 ad rows
    expect(runs[0].totalThreats).toBe(1)
  })

  it('sorts by checkedAt descending before grouping', () => {
    const checks = [
      makeCheck('3', '2026-03-28T09:00:00Z'),
      makeCheck('1', '2026-03-28T08:00:00Z'),
      makeCheck('2', '2026-03-28T08:01:00Z'),
    ]
    const runs = groupChecksIntoRuns(checks)
    expect(runs).toHaveLength(2)
    // First run should be the 09:00 check (most recent)
    expect(runs[0].checks[0].id).toBe('3')
  })
})
