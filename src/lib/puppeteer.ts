import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'

const DEFAULT_CHROMIUM_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'

export async function screenshotSerp(keyword: string): Promise<Buffer> {
  const executablePath = await chromium.executablePath(process.env.CHROMIUM_URL || DEFAULT_CHROMIUM_URL)
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: true,
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 900 })
    try {
      await page.goto(
        `https://www.google.co.uk/search?q=${encodeURIComponent(keyword)}&gl=gb&hl=en`,
        { waitUntil: 'networkidle2', timeout: 15000 }
      )
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        // Page loaded but networkidle2 timed out — screenshot what we have
        console.warn(`page.goto timeout for keyword "${keyword}", screenshotting partial load`)
      } else {
        throw err
      }
    }
    return Buffer.from(await page.screenshot({ type: 'png', fullPage: false }))
  } finally {
    await browser.close()
  }
}
