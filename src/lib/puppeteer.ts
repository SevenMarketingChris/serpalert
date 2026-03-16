import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'

const CHROMIUM_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'

export async function screenshotSerp(keyword: string): Promise<Buffer> {
  const executablePath = await chromium.executablePath(CHROMIUM_URL)
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: true,
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 900 })
    await page.goto(
      `https://www.google.co.uk/search?q=${encodeURIComponent(keyword)}&gl=gb&hl=en`,
      { waitUntil: 'networkidle2', timeout: 15000 }
    )
    return Buffer.from(await page.screenshot({ type: 'png', fullPage: false }))
  } finally {
    await browser.close()
  }
}
