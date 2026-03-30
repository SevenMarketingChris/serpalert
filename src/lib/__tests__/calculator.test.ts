import { describe, it, expect } from 'vitest'

// Test the core calculator logic (same as in budget-calculator.tsx)
function calculateRedirect(brandSpend: number, brandRoas: number, nonBrandRoas: number, retentionRate: number) {
  const currentBrandRevenue = brandSpend * brandRoas
  const retainedRevenue = currentBrandRevenue * (retentionRate / 100)
  const lostRevenue = currentBrandRevenue - retainedRevenue
  const newAcquisitionRevenue = brandSpend * nonBrandRoas
  const netMonthlyGain = newAcquisitionRevenue - lostRevenue
  return { currentBrandRevenue, retainedRevenue, lostRevenue, newAcquisitionRevenue, netMonthlyGain }
}

describe('budget redirect calculator', () => {
  it('calculates positive scenario correctly', () => {
    const r = calculateRedirect(2000, 10, 6, 80)
    expect(r.currentBrandRevenue).toBe(20000)
    expect(r.retainedRevenue).toBe(16000)
    expect(r.lostRevenue).toBe(4000)
    expect(r.newAcquisitionRevenue).toBe(12000)
    expect(r.netMonthlyGain).toBe(8000)
  })

  it('calculates negative scenario correctly', () => {
    const r = calculateRedirect(2000, 20, 1, 50)
    expect(r.lostRevenue).toBe(20000)
    expect(r.newAcquisitionRevenue).toBe(2000)
    expect(r.netMonthlyGain).toBe(-18000)
  })

  it('handles break-even', () => {
    // 2000 * 10 * 0.2 = 4000 lost, 2000 * 2 = 4000 gained
    const r = calculateRedirect(2000, 10, 2, 80)
    expect(r.netMonthlyGain).toBe(0)
  })
})
