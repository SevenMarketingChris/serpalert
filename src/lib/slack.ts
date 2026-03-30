export async function sendNewCompetitorAlert(params: {
  webhookUrl: string | null
  brandName: string
  domain: string
  keyword: string
}): Promise<void> {
  if (!params.webhookUrl) return

  if (!params.webhookUrl.startsWith('https://hooks.slack.com/')) {
    console.error('Slack webhook URL does not look valid, skipping')
    return
  }

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
          ]
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Dashboard' },
              url: `https://serpalert.vercel.app/dashboard`,
              style: 'primary'
            }
          ]
        }
      ],
      text: `New competitor ${params.domain} detected on "${params.keyword}" for ${params.brandName}`,
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    console.error(`Slack webhook failed: ${response.status}`, body.slice(0, 200))
    throw new Error(`Slack webhook failed: ${response.status}`)
  }
}
