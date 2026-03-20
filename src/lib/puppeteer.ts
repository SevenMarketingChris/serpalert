import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'

const DEFAULT_CHROMIUM_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v143.0.1/chromium-v143.0.1-pack.tar'

export async function screenshotSerp(keyword: string): Promise<Buffer> {
  const executablePath = await chromium.executablePath(process.env.CHROMIUM_URL || DEFAULT_CHROMIUM_URL)
  const browser = await puppeteer.launch({
    args: [
      ...chromium.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
    executablePath,
    headless: true,
  })

  try {
    const page = await browser.newPage()

    // Set a realistic user agent to avoid bot detection
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    )
    await page.setViewport({ width: 1280, height: 900 })

    // Set a cookie to bypass Google's consent page
    await page.setCookie({
      name: 'CONSENT',
      value: 'PENDING+987',
      domain: '.google.co.uk',
    }, {
      name: 'CONSENT',
      value: 'PENDING+987',
      domain: '.google.com',
    })

    try {
      await page.goto(
        `https://www.google.co.uk/search?q=${encodeURIComponent(keyword)}&gl=gb&hl=en`,
        { waitUntil: 'networkidle2', timeout: 20000 }
      )
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        console.warn(`page.goto timeout for keyword "${keyword}", screenshotting partial load`)
      } else {
        throw err
      }
    }

    // Dismiss any consent overlay if it still appears
    try {
      const consentButton = await page.$('button[id="L2AGLb"], button[aria-label="Accept all"]')
      if (consentButton) {
        await consentButton.click()
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {})
      }
    } catch {
      // No consent dialog, continue
    }

    return Buffer.from(await page.screenshot({ type: 'png', fullPage: false }))
  } finally {
    await browser.close()
  }
}
