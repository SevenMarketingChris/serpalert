import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'

const CHROMIUM_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'

export async function screenshotSerp(keyword: string): Promise<Buffer> {
  const executablePath = await chromium.executablePath(CHROMIUM_URL)
  const browser = await puppeteer.launch({
    args: [
      ...chromium.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
    executablePath,
    headless: true,
  })

  try {
    const page = await browser.newPage()

    // Hide automation signals
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).chrome
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).chrome = { runtime: {} }
    })

    await page.setViewport({ width: 1366, height: 768 })
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    )
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-GB,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
    })

    await page.goto(
      `https://www.google.co.uk/search?q=${encodeURIComponent(keyword)}&gl=gb&hl=en&num=10`,
      { waitUntil: 'domcontentloaded', timeout: 20000 }
    )

    // Let ads and lazy content render
    await new Promise(r => setTimeout(r, 2000))

    return Buffer.from(await page.screenshot({ type: 'png', fullPage: false }))
  } finally {
    await browser.close()
  }
}

export async function screenshotLandingPage(url: string): Promise<Buffer> {
  const executablePath = await chromium.executablePath(CHROMIUM_URL)
  const browser = await puppeteer.launch({
    args: [
      ...chromium.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
    executablePath,
    headless: true,
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 900 })
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    )
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-GB,en;q=0.9',
    })
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
    // Brief wait for hero images and layout to settle
    await new Promise(r => setTimeout(r, 1500))
    return Buffer.from(await page.screenshot({ type: 'png', fullPage: false }))
  } finally {
    await browser.close()
  }
}
