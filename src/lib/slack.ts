export async function sendNewCompetitorAlert(params: {
  webhookUrl: string | null
  brandName: string
  brandId?: string
  domain: string
  keyword: string
  urgency?: 'urgent' | 'monitor' | 'ignore' | null
}): Promise<void> {
  if (!params.webhookUrl) return

  if (!params.webhookUrl.startsWith('https://hooks.slack.com/')) {
    console.error('Slack webhook URL does not look valid, skipping')
    return
  }

  const urgencyLabel = params.urgency === 'urgent'
    ? '🔴 URGENT'
    : params.urgency === 'ignore'
      ? '⚪ Low Priority'
      : '🟡 Monitor'

  const response = await fetch(params.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: `🚨 New Competitor on "${params.keyword}"` }
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Brand:*\n${params.brandName}` },
            { type: 'mrkdwn', text: `*Competitor:*\n${params.domain}` },
            { type: 'mrkdwn', text: `*Keyword:*\n${params.keyword}` },
            { type: 'mrkdwn', text: `*Detected:*\n${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` },
            { type: 'mrkdwn', text: `*Priority:*\n${urgencyLabel}` },
          ]
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Dashboard' },
              url: params.brandId
                ? `https://serpalert.co.uk/dashboard/${params.brandId}`
                : `https://serpalert.co.uk/dashboard`,
              style: 'primary'
            }
          ]
        }
      ],
      text: `New competitor ${params.domain} detected on "${params.keyword}" for ${params.brandName}`,
    }),
    redirect: 'error',
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    console.error(`Slack webhook failed: ${response.status}`, body.slice(0, 200))
    throw new Error(`Slack webhook failed: ${response.status}`)
  }
}

export async function sendDailySummary(params: {
  webhookUrl: string
  brandName: string
  brandId: string
  checksYesterday: number
  competitorsFound: { domain: string; keyword: string; position: number | null }[]
  screenshotCount: number
  isProtected: boolean
}): Promise<void> {
  if (!params.webhookUrl.startsWith('https://hooks.slack.com/')) return

  const { brandName, checksYesterday, competitorsFound, screenshotCount, isProtected } = params
  const uniqueDomains = [...new Set(competitorsFound.map(c => c.domain))]

  const statusEmoji = isProtected ? '🟢' : '🔴'
  const statusText = isProtected
    ? 'No competitors detected yesterday'
    : `${uniqueDomains.length} competitor${uniqueDomains.length !== 1 ? 's' : ''} detected`

  const blocks: Record<string, unknown>[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `📊 Daily Summary — ${brandName}`, emoji: true },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${statusEmoji} *${statusText}*\n${checksYesterday} checks ran · ${screenshotCount} screenshots captured`,
      },
    },
  ]

  if (competitorsFound.length > 0) {
    // Group by domain
    const byDomain = new Map<string, { keywords: string[]; positions: (number | null)[] }>()
    for (const c of competitorsFound) {
      const existing = byDomain.get(c.domain) || { keywords: [], positions: [] }
      if (!existing.keywords.includes(c.keyword)) existing.keywords.push(c.keyword)
      existing.positions.push(c.position)
      byDomain.set(c.domain, existing)
    }

    let competitorText = ''
    for (const [domain, data] of byDomain) {
      const avgPos = data.positions.filter(Boolean).length > 0
        ? (data.positions.filter(Boolean).reduce((a, b) => a! + b!, 0)! / data.positions.filter(Boolean).length).toFixed(1)
        : 'N/A'
      competitorText += `• *${domain}* — position ${avgPos}, keywords: ${data.keywords.join(', ')}\n`
    }

    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: competitorText.trim() },
    })
  }

  blocks.push({
    type: 'context',
    elements: [
      { type: 'mrkdwn', text: `SerpAlert daily summary · ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}` },
    ],
  })

  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: 'View Dashboard', emoji: true },
        url: `https://serpalert.co.uk/dashboard/${params.brandId}`,
      },
    ],
  })

  try {
    await fetch(params.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'error',
      body: JSON.stringify({ blocks }),
    })
  } catch (err) {
    console.error('Slack daily summary failed:', err instanceof Error ? err.message : err)
  }
}
