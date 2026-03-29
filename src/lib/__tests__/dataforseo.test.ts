import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

import { checkSerpForBrand } from '@/lib/dataforseo'

const makeResponse = (items: object[]) => ({
  ok: true,
  json: async () => ({ tasks: [{ result: [{ items }] }] }),
})

describe('checkSerpForBrand', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.DATAFORSEO_LOGIN = 'login'
    process.env.DATAFORSEO_PASSWORD = 'pass'
  })

  it('returns empty ads array when no paid ads', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse([
      { type: 'organic', domain: 'example.com' }
    ]))
    const result = await checkSerpForBrand('TestBrand')
    expect(result.ads).toEqual([])
  })

  it('returns competitor ads for paid items', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse([{
      type: 'paid', domain: 'rival.com', title: 'Rival Ad',
      description: 'Desc', breadcrumb: 'rival.com', url: 'https://rival.com', rank_absolute: 1,
    }]))
    const result = await checkSerpForBrand('TestBrand')
    expect(result.ads).toHaveLength(1)
    expect(result.ads[0].domain).toBe('rival.com')
  })

  it('excludes brand domain from results', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse([{
      type: 'paid', domain: 'testbrand.com', title: 'Own Ad', rank_absolute: 1,
    }]))
    const result = await checkSerpForBrand('TestBrand', 'United Kingdom', { brandDomain: 'testbrand.com' })
    expect(result.ads).toEqual([])
  })

  it('returns empty ads when credentials missing', async () => {
    delete process.env.DATAFORSEO_LOGIN
    const result = await checkSerpForBrand('test')
    expect(result.ads).toEqual([])
  })
})
