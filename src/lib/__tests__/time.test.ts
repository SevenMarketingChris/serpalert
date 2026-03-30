import { describe, it, expect } from 'vitest'
import { getRelativeTime, toUTCDate } from '../time'

describe('toUTCDate', () => {
  it('returns YYYY-MM-DD format', () => {
    const d = new Date('2026-03-28T15:30:00Z')
    expect(toUTCDate(d)).toBe('2026-03-28')
  })

  it('uses UTC, not local time', () => {
    // 23:30 UTC on March 28 should still be March 28, not March 29
    const d = new Date('2026-03-28T23:30:00Z')
    expect(toUTCDate(d)).toBe('2026-03-28')
  })
})

describe('getRelativeTime', () => {
  it('returns "Never" for null', () => {
    expect(getRelativeTime(null)).toBe('Never')
  })

  it('returns "just now" for recent dates', () => {
    const now = new Date()
    expect(getRelativeTime(now)).toBe('just now')
  })

  it('accepts string dates', () => {
    const result = getRelativeTime(new Date().toISOString())
    expect(result).toBe('just now')
  })
})
