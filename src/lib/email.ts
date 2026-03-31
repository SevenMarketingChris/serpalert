import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend {
  if (_resend) return _resend
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY not set')
  _resend = new Resend(key)
  return _resend
}

export async function sendWelcomeEmail(to: string, brandName: string) {
  const resend = getResend()
  await resend.emails.send({
    from: 'SerpAlert <noreply@serpalert.co.uk>',
    to,
    subject: `Welcome to SerpAlert — ${brandName} is now being monitored`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="font-size: 20px; color: #111;">Welcome to SerpAlert</h1>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Your brand <strong>${escapeHtml(brandName)}</strong> is now being monitored for competitor ads on Google.
        </p>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          We check your brand keywords multiple times daily. If a competitor starts bidding on your brand, you'll be alerted immediately.
        </p>
        <h2 style="font-size: 16px; color: #111; margin-top: 24px;">What happens next?</h2>
        <ul style="color: #555; font-size: 14px; line-height: 1.8;">
          <li>Your first SERP check will run within the hour</li>
          <li>Set up Slack alerts in Settings for instant notifications</li>
          <li>Your 7-day free trial has started — no credit card needed yet</li>
        </ul>
        <p style="margin-top: 24px;">
          <a href="https://serpalert.co.uk/dashboard" style="display: inline-block; background: #4f46e5; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
            Go to Dashboard
          </a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          SerpAlert — Brand keyword monitoring by <a href="https://sevenmarketing.co.uk" style="color: #999;">Seven Marketing</a>
        </p>
      </div>
    `,
  })
}

export async function sendTrialExpiringEmail(to: string, brandName: string, daysLeft: number) {
  const resend = getResend()
  await resend.emails.send({
    from: 'SerpAlert <noreply@serpalert.co.uk>',
    to,
    subject: `Your SerpAlert trial expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="font-size: 20px; color: #111;">Your trial is ending soon</h1>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Your free trial for <strong>${escapeHtml(brandName)}</strong> expires in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>.
        </p>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          After your trial ends, monitoring will pause. Subscribe now to keep protecting your brand.
        </p>
        <p style="margin-top: 24px;">
          <a href="https://serpalert.co.uk/dashboard" style="display: inline-block; background: #4f46e5; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
            Subscribe Now — £149/mo
          </a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          SerpAlert — Brand keyword monitoring by <a href="https://sevenmarketing.co.uk" style="color: #999;">Seven Marketing</a>
        </p>
      </div>
    `,
  })
}

export async function sendNewCompetitorEmail(to: string, brandName: string, competitorDomain: string, keyword: string, screenshotUrl: string | null) {
  const resend = getResend()
  await resend.emails.send({
    from: 'SerpAlert <noreply@serpalert.co.uk>',
    to,
    subject: `New competitor detected on "${escapeHtml(brandName)}" — ${competitorDomain}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="font-size: 20px; color: #111;">New Competitor Alert</h1>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          A new competitor has been detected bidding on your brand keyword.
        </p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-size: 14px;"><strong style="color: #111;">Competitor:</strong> <span style="color: #dc2626; font-family: monospace;">${escapeHtml(competitorDomain)}</span></p>
          <p style="margin: 8px 0 0; font-size: 14px;"><strong style="color: #111;">Keyword:</strong> <span style="font-family: monospace;">${escapeHtml(keyword)}</span></p>
          <p style="margin: 8px 0 0; font-size: 14px;"><strong style="color: #111;">Brand:</strong> ${escapeHtml(brandName)}</p>
        </div>
        ${screenshotUrl ? `<p style="margin: 16px 0;"><img src="${escapeHtml(screenshotUrl)}" alt="SERP screenshot" style="width: 100%; border-radius: 8px; border: 1px solid #e5e7eb;" /></p>` : ''}
        <p style="margin-top: 24px;">
          <a href="https://serpalert.co.uk/dashboard" style="display: inline-block; background: #4f46e5; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
            View Dashboard
          </a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          SerpAlert — Brand keyword monitoring by <a href="https://sevenmarketing.co.uk" style="color: #999;">Seven Marketing</a>
        </p>
      </div>
    `,
  })
}

export async function sendTrialExpiredEmail(to: string, brandName: string) {
  const resend = getResend()
  await resend.emails.send({
    from: 'SerpAlert <noreply@serpalert.co.uk>',
    to,
    subject: `Your SerpAlert trial has expired — ${escapeHtml(brandName)}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="font-size: 20px; color: #111;">Your trial has ended</h1>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Your free trial for <strong>${escapeHtml(brandName)}</strong> has expired. Monitoring is now paused — but all your historical data is still available.
        </p>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Subscribe now to resume hourly monitoring and keep protecting your brand.
        </p>
        <p style="margin-top: 24px;">
          <a href="https://serpalert.co.uk/dashboard" style="display: inline-block; background: #4f46e5; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
            Subscribe — £149/mo
          </a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          SerpAlert — Brand keyword monitoring by <a href="https://sevenmarketing.co.uk" style="color: #999;">Seven Marketing</a>
        </p>
      </div>
    `,
  })
}

export async function sendPaymentFailedEmail(to: string, brandName: string) {
  const resend = getResend()
  await resend.emails.send({
    from: 'SerpAlert <noreply@serpalert.co.uk>',
    to,
    subject: `Payment failed for ${escapeHtml(brandName)} — action required`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="font-size: 20px; color: #111;">Payment failed</h1>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          We were unable to process your payment for <strong>${escapeHtml(brandName)}</strong>. Your monitoring is still running but will be paused if payment is not updated.
        </p>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Please update your payment method to avoid any interruption.
        </p>
        <p style="margin-top: 24px;">
          <a href="https://serpalert.co.uk/dashboard" style="display: inline-block; background: #f59e0b; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
            Update Payment Method
          </a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          SerpAlert — Brand keyword monitoring by <a href="https://sevenmarketing.co.uk" style="color: #999;">Seven Marketing</a>
        </p>
      </div>
    `,
  })
}

export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    return user.emailAddresses?.[0]?.emailAddress ?? null
  } catch {
    return null
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
