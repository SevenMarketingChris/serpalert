import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => {
  const db = {
    select: vi.fn().mockReturnThis(),
    selectDistinct: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
  }
  return {
    db,
    brands: {}, serpChecks: {}, competitorAds: {}, auctionInsights: {},
  }
})

import { getBrandByToken, insertSerpCheck, getAllActiveBrands } from '@/lib/db/queries'

describe('getBrandByToken', () => {
  it('returns null when no brand found', async () => {
    const { db } = await import('@/lib/db')
    vi.mocked(db.select().from(undefined as never).where(undefined as never).limit).mockResolvedValueOnce([])
    const result = await getBrandByToken('no-such-token')
    expect(result).toBeNull()
  })
})

describe('insertSerpCheck', () => {
  it('throws when insert returns empty array', async () => {
    const { db } = await import('@/lib/db')
    vi.mocked(db.insert).mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    } as never)
    await expect(
      insertSerpCheck({ brandId: 'b1', keyword: 'test', competitorCount: 0 })
    ).rejects.toThrow('Failed to insert serp check')
  })
})

describe('getAllActiveBrands', () => {
  it('returns empty array when no active brands', async () => {
    const { db } = await import('@/lib/db')
    vi.mocked(db.select().from(undefined as never).where).mockResolvedValueOnce([])
    const result = await getAllActiveBrands()
    expect(result).toEqual([])
  })
})
