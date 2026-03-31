/**
 * Take a SERP screenshot using the DataForSEO Screenshot API.
 *
 * Requires a task_id from a previous DataForSEO SERP task.
 * This replaces Puppeteer which gets blocked by Google's bot detection on cloud IPs.
 */
export async function screenshotSerp(taskId: string): Promise<Buffer> {
  if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
    throw new Error('Missing DataForSEO credentials')
  }

  const credentials = Buffer.from(
    `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`
  ).toString('base64')

  console.info(`DataForSEO screenshot: requesting for task ${taskId}`)

  const response = await fetch(
    'https://api.dataforseo.com/v3/serp/screenshot',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ task_id: taskId }]),
      signal: AbortSignal.timeout(45_000),
    }
  )

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`DataForSEO screenshot ${response.status}: ${text.slice(0, 200)}`)
  }

  const data = await response.json()
  const task = data?.tasks?.[0]

  if (!task || task.status_code !== 20000) {
    const msg = task?.status_message ?? 'Unknown error'
    console.error(`DataForSEO screenshot failed for task ${taskId}: ${msg}`)
    throw new Error(`DataForSEO screenshot failed: ${msg}`)
  }

  const imageUrl = task.result?.[0]?.items?.[0]?.image
  if (!imageUrl) {
    throw new Error(`DataForSEO screenshot: no image returned for task ${taskId}`)
  }

  const parsedUrl = new URL(imageUrl)
  if (parsedUrl.protocol !== 'https:') {
    throw new Error('Screenshot URL must be HTTPS')
  }

  console.info(`DataForSEO screenshot: downloading from ${imageUrl.slice(0, 80)}...`)

  const imgResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) })
  if (!imgResponse.ok) {
    throw new Error(`Failed to download screenshot: ${imgResponse.status}`)
  }

  return Buffer.from(await imgResponse.arrayBuffer())
}
