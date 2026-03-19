import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockQuery = vi.fn().mockResolvedValue([])
const mockCustomer = vi.fn().mockReturnValue({ query: mockQuery })

vi.mock('google-ads-api', () => ({
  GoogleAdsApi: vi.fn().mockImplementation(function () {
    return { Customer: mockCustomer }
  }),
}))

import { getAuctionInsights } from '@/lib/google-ads'

describe('getAuctionInsights', () => {
  beforeEach(() => {
    process.env.GOOGLE_ADS_CLIENT_ID = 'id'
    process.env.GOOGLE_ADS_CLIENT_SECRET = 'secret'
    process.env.GOOGLE_ADS_REFRESH_TOKEN = 'token'
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN = 'dev'
  })

  it('returns empty array when no rows', async () => {
    expect(await getAuctionInsights('123-456-7890')).toEqual([])
  })
})
