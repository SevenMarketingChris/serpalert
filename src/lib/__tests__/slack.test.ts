import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

import { sendNewCompetitorAlert } from '@/lib/slack'

describe('sendNewCompetitorAlert', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockFetch.mockResolvedValue({ ok: true })
  })

  it('POSTs to the webhook URL', async () => {
    await sendNewCompetitorAlert({
      webhookUrl: 'https://hooks.slack.com/test',
      brandName: 'Acme',
      domain: 'rival.com',
      keyword: 'Acme',
    })
    expect(mockFetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/test',
      expect.objectContaining({ method: 'POST' })
    )
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.text).toContain('rival.com')
  })

  it('does nothing without a webhook URL', async () => {
    await sendNewCompetitorAlert({
      webhookUrl: null,
      brandName: 'Acme',
      domain: 'rival.com',
      keyword: 'Acme',
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
