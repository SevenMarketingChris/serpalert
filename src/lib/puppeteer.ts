/**
 * Take a SERP screenshot using the DataForSEO Screenshot API.
 *
 * This replaces Puppeteer-based screenshots which get blocked by Google's
 * bot detection on cloud IPs (Vercel, AWS, etc.). DataForSEO has residential
 * proxies and infrastructure built specifically for this.
 */
export async function screenshotSerp(keyword: string): Promise<Buffer> {
  if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
    throw new Error('Missing DataForSEO credentials')
  }

  const credentials = Buffer.from(
    `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`
  ).toString('base64')

  const searchUrl = `https://www.google.co.uk/search?q=${encodeURIComponent(keyword)}&gl=gb&hl=en`

  const response = await fetch(
    'https://api.dataforseo.com/v3/serp/screenshot',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        url: searchUrl,
        full_page_screenshot: false,
        browser_preset: 'desktop',
      }]),
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
    console.error(`DataForSEO screenshot failed for "${keyword}": ${msg}`)
    throw new Error(`DataForSEO screenshot failed: ${msg}`)
  }

  const imageUrl = task.result?.[0]?.items?.[0]?.image
  if (!imageUrl) {
    // Fallback: try the encoded image data
    const imageData = task.result?.[0]?.items?.[0]?.encoded_image
    if (imageData) {
      return Buffer.from(imageData, 'base64')
    }
    throw new Error(`DataForSEO screenshot: no image returned for "${keyword}"`)
  }

  // Download the screenshot image
  const imgResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) })
  if (!imgResponse.ok) {
    throw new Error(`Failed to download screenshot: ${imgResponse.status}`)
  }

  return Buffer.from(await imgResponse.arrayBuffer())
}
