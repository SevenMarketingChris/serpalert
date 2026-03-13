import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('google-ads-api', () => {
  const mockQuery = vi.fn().mockResolvedValue([])
  const mockCustomer = vi.fn().mockReturnValue({ query: mockQuery })
  const GoogleAdsApi = vi.fn(function() {
    this.Customer = mockCustomer
  })
  return { GoogleAdsApi }
})

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
