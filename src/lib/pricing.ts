// Cumulative volume tiers — each tier only applies to brands IN that bracket
// Ensures total always increases with each additional brand
const TIERS = [
  { upTo: 3, pricePerBrand: 99 },   // Brands 1-3: £99 each
  { upTo: 5, pricePerBrand: 89 },   // Brands 4-5: £89 each
  { upTo: 10, pricePerBrand: 79 },  // Brands 6-10: £79 each
  { upTo: 20, pricePerBrand: 69 },  // Brands 11-20: £69 each
  { upTo: Infinity, pricePerBrand: 59 }, // 21+: £59 each
]

export function calculateAgencyMonthlyTotal(brandCount: number): number {
  let total = 0
  let remaining = brandCount
  let prevUpTo = 0

  for (const tier of TIERS) {
    if (remaining <= 0) break
    const brandsInTier = Math.min(remaining, tier.upTo - prevUpTo)
    total += brandsInTier * tier.pricePerBrand
    remaining -= brandsInTier
    prevUpTo = tier.upTo
  }

  return total
}

export function getAgencyPriceBreakdown(brandCount: number): { tier: string; count: number; price: number; subtotal: number }[] {
  const breakdown: { tier: string; count: number; price: number; subtotal: number }[] = []
  let remaining = brandCount
  let prevUpTo = 0

  for (const tier of TIERS) {
    if (remaining <= 0) break
    const brandsInTier = Math.min(remaining, tier.upTo - prevUpTo)
    breakdown.push({
      tier: `${prevUpTo + 1}-${Math.min(tier.upTo, prevUpTo + brandsInTier)}`,
      count: brandsInTier,
      price: tier.pricePerBrand,
      subtotal: brandsInTier * tier.pricePerBrand,
    })
    remaining -= brandsInTier
    prevUpTo = tier.upTo
  }

  return breakdown
}

export function getEffectivePerBrandPrice(brandCount: number): number {
  if (brandCount === 0) return TIERS[0].pricePerBrand
  return Math.round(calculateAgencyMonthlyTotal(brandCount) / brandCount)
}

export const TIER_TABLE = TIERS
