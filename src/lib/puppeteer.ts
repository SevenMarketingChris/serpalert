import puppeteer from 'puppeteer-core'

/**
 * Resolve the Chromium executable path.
 *
 * On Coolify/Docker: use system-installed chromium/google-chrome
 * (the Dockerfile installs chromium via apt).
 *
 * Fallback: use @sparticuz/chromium-min for serverless environments.
 */
async function getExecPath(): Promise<string> {
  // Check for system-installed browsers (Docker / Coolify)
  const { execSync } = await import('child_process')
  for (const bin of ['chromium-browser', 'chromium', 'google-chrome-stable', 'google-chrome']) {
    try {
      const p = execSync(`which ${bin}`, { encoding: 'utf-8' }).trim()
      if (p) return p
    } catch {
      // not found, try next
    }
  }

  // Fallback: serverless chromium (Vercel/Lambda)
  const chromium = (await import('@sparticuz/chromium-min')).default
  return chromium.executablePath(
    'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
  )
}

export async function screenshotSerp(keyword: string): Promise<Buffer> {
  const executablePath = await getExecPath()
  console.log(`Puppeteer using browser: ${executablePath}`)

  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
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
