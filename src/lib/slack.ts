/**
 * Parse webhook URLs — supports comma-separated for multiple Slack instances.
 */
function parseWebhookUrls(webhookUrl: string | null): string[] {
  if (!webhookUrl) return []
  return webhookUrl.split(',').map(u => u.trim()).filter(u => u.startsWith('https://hooks.slack.com/'))
}

/**
 * Send a Slack payload to one or more webhook URLs.
 */
async function sendToWebhooks(urls: string[], payload: Record<string, unknown>): Promise<void> {
  await Promise.allSettled(urls.map(url =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'error',
      body: JSON.stringify(payload),
    }).catch(err => console.error(`Slack webhook failed (${url.slice(0, 40)}...):`, err instanceof Error ? err.message : err))
  ))
}

export async function sendNewCompetitorAlert(params: {
  webhookUrl: string | null
  brandName: string
  brandId?: string
  domain: string
  keyword: string
  urgency?: 'urgent' | 'monitor' | 'ignore' | null
}): Promise<void> {
  const urls = parseWebhookUrls(params.webhookUrl)
  if (urls.length === 0) return

  const urgencyLabel = params.urgency === 'urgent'
    ? '🔴 URGENT'
    : params.urgency === 'ignore'
      ? '⚪ Low Priority'
      : '🟡 Monitor'

  const payload = {
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
  }

  await sendToWebhooks(urls, payload)
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
  const urls = parseWebhookUrls(params.webhookUrl)
  if (urls.length === 0) return

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

  await sendToWebhooks(urls, { blocks })
}
