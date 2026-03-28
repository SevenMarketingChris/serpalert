import puppeteer from 'puppeteer-core'

/**
 * Resolve the Chromium executable path.
 *
 * Uses @sparticuz/chromium-min for serverless environments (Vercel/Lambda).
 * Falls back to system-installed chromium for local dev / Docker.
 */
async function getExecPath(): Promise<string> {
  // Serverless: use @sparticuz/chromium-min (primary path on Vercel)
  try {
    const chromium = (await import('@sparticuz/chromium-min')).default
    return chromium.executablePath(
      'https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar'
    )
  } catch {
    // Not available (e.g. local dev without the package)
  }

  // Fallback: system-installed browser (local dev / Docker)
  const { execSync } = await import('child_process')
  for (const bin of ['chromium-browser', 'chromium', 'google-chrome-stable', 'google-chrome']) {
    try {
      const p = execSync(`which ${bin}`, { encoding: 'utf-8' }).trim()
      if (p) return p
    } catch {
      // not found, try next
    }
  }

  throw new Error('No Chromium binary found')
}

export async function screenshotSerp(keyword: string): Promise<Buffer> {
  const executablePath = await getExecPath()
  console.log(`Puppeteer using browser: ${executablePath}`)

  // Ensure Chromium has writable dirs for crash handler and profile data
  process.env.HOME = process.env.HOME || '/tmp'
  process.env.XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME || '/tmp/.config'
  process.env.XDG_CACHE_HOME = process.env.XDG_CACHE_HOME || '/tmp/.cache'

  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--disable-crash-reporter',
      '--disable-breakpad',
      '--no-zygote',
      '--disable-extensions',
      '--crash-dumps-dir=/tmp/chromium-crashes',
      '--user-data-dir=/tmp/chromium-data',
    ],
    executablePath,
    headless: true,
  })

  try {
    const page = await browser.newPage()

    // Set a realistic user agent to avoid bot detection
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
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
