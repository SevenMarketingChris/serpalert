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
      text: `🚨 New competitor bidding on *${params.brandName}*\n*Domain:* ${params.domain}\n*Keyword:* ${params.keyword}`,
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    console.error(`Slack webhook failed: ${response.status}`, body.slice(0, 200))
    throw new Error(`Slack webhook failed: ${response.status}`)
  }
}
