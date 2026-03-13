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

  it('returns empty array when no paid ads', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse([
      { type: 'organic', domain: 'example.com' }
    ]))
    expect(await checkSerpForBrand('TestBrand')).toEqual([])
  })

  it('returns competitor ads for paid items', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse([{
      type: 'paid', domain: 'rival.com', title: 'Rival Ad',
      description: 'Desc', breadcrumb: 'rival.com', url: 'https://rival.com', rank_absolute: 1,
    }]))
    const result = await checkSerpForBrand('TestBrand')
    expect(result).toHaveLength(1)
    expect(result[0].domain).toBe('rival.com')
  })

  it('excludes brand domain from results', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse([{
      type: 'paid', domain: 'testbrand.com', title: 'Own Ad', rank_absolute: 1,
    }]))
    const result = await checkSerpForBrand('TestBrand', 'United Kingdom', { brandDomain: 'testbrand.com' })
    expect(result).toEqual([])
  })

  it('throws when credentials missing', async () => {
    const originalLogin = process.env.DATAFORSEO_LOGIN
    delete process.env.DATAFORSEO_LOGIN
    await expect(checkSerpForBrand('test')).rejects.toThrow('Missing DataForSEO credentials')
    process.env.DATAFORSEO_LOGIN = originalLogin
  })
})
