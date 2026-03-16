export async function sendNewCompetitorAlert(params: {
  webhookUrl: string | null
  brandName: string
  domain: string
  keyword: string
}): Promise<void> {
  if (!params.webhookUrl) return

  await fetch(params.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 New competitor bidding on *${params.brandName}*\n*Domain:* ${params.domain}\n*Keyword:* ${params.keyword}`,
    }),
  })
}

export async function sendCopyChangeAlert(params: {
  webhookUrl: string | null
  brandName: string
  domain: string
  keyword: string
  oldHeadline: string
  newHeadline: string
}): Promise<void> {
  if (!params.webhookUrl) return

  await fetch(params.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `✏️ *${params.domain}* updated their ad copy targeting *${params.brandName}*\n*Keyword:* ${params.keyword}\n*Was:* ${params.oldHeadline}\n*Now:* ${params.newHeadline}`,
    }),
  })
}
