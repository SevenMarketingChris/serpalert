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

export async function sendNewCompetitorEmail(to: string, brandName: string, competitorDomain: string, keyword: string, screenshotUrl: string | null, aiSummary: string | null = null) {
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
        ${aiSummary ? `
        <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #818cf8; margin: 0 0 8px;">AI Insights</p>
          <p style="font-size: 14px; color: #4338ca; line-height: 1.6; margin: 0;">${escapeHtml(aiSummary)}</p>
        </div>
        ` : ''}
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

export async function sendMonthlyReport(
  to: string,
  brandName: string,
  data: {
    totalChecks: number
    newCompetitors: { domain: string; count: number }[]
    mostActiveCompetitor: string | null
    keywordsMonitored: number
    screenshotCount: number
    screenshotUrls: string[] // top 3 screenshots
  },
  aiInsights: string | null = null,
) {
  const resend = getResend()

  const competitorRows = data.newCompetitors.length > 0
    ? data.newCompetitors.slice(0, 10).map(c =>
        `<tr><td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6; font-family: monospace; font-size: 13px;">${escapeHtml(c.domain)}</td><td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6; text-align: right; font-family: monospace; font-size: 13px;">${c.count}x</td></tr>`
      ).join('')
    : '<tr><td colspan="2" style="padding: 12px; color: #22c55e; text-align: center;">No competitors detected this month</td></tr>'

  const screenshotImgs = data.screenshotUrls.slice(0, 3).map(url =>
    `<img src="${escapeHtml(url)}" alt="SERP screenshot" style="width: 100%; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 12px;" />`
  ).join('')

  await resend.emails.send({
    from: 'SerpAlert <noreply@serpalert.co.uk>',
    to,
    subject: `Monthly Report — ${escapeHtml(brandName)} — ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="font-size: 20px; color: #111;">Monthly Report</h1>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Here's your brand protection summary for <strong>${escapeHtml(brandName)}</strong> over the last 30 days.
        </p>

        <!-- Stats -->
        <div style="display: flex; gap: 12px; margin: 20px 0;">
          <div style="flex: 1; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af;">Checks</div>
            <div style="font-size: 24px; font-weight: 700; font-family: monospace; color: #111;">${data.totalChecks}</div>
          </div>
          <div style="flex: 1; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af;">Competitors</div>
            <div style="font-size: 24px; font-weight: 700; font-family: monospace; color: ${data.newCompetitors.length > 0 ? '#dc2626' : '#22c55e'};">${data.newCompetitors.length}</div>
          </div>
          <div style="flex: 1; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af;">Keywords</div>
            <div style="font-size: 24px; font-weight: 700; font-family: monospace; color: #111;">${data.keywordsMonitored}</div>
          </div>
        </div>

        ${data.mostActiveCompetitor ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin: 16px 0;">
          <p style="margin: 0; font-size: 13px; color: #555;">Most active competitor: <strong style="color: #dc2626; font-family: monospace;">${escapeHtml(data.mostActiveCompetitor)}</strong></p>
        </div>
        ` : ''}

        ${aiInsights ? `
        <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #818cf8; margin: 0 0 8px;">AI Insights</p>
          <p style="font-size: 14px; color: #4338ca; line-height: 1.6; margin: 0;">${escapeHtml(aiInsights)}</p>
        </div>
        ` : ''}

        <!-- Competitor table -->
        <h2 style="font-size: 14px; color: #111; margin-top: 24px;">Competitors Detected</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af;">Domain</th>
              <th style="padding: 8px 12px; text-align: right; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af;">Times Seen</th>
            </tr>
          </thead>
          <tbody>
            ${competitorRows}
          </tbody>
        </table>

        ${screenshotImgs ? `
        <h2 style="font-size: 14px; color: #111; margin-top: 24px;">Recent Screenshots</h2>
        <p style="color: #999; font-size: 12px; margin-bottom: 12px;">Latest SERP captures showing competitor activity</p>
        ${screenshotImgs}
        ` : ''}

        <p style="margin-top: 24px;">
          <a href="https://serpalert.co.uk/dashboard" style="display: inline-block; background: #4f46e5; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
            View Full Dashboard
          </a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          SerpAlert — Brand keyword monitoring by <a href="https://sevenmarketing.co.uk" style="color: #999;">Seven Marketing</a>
        </p>
      </div>
    `,
  })
}

export async function sendAuditReportEmail(
  to: string,
  keyword: string,
  competitors: Array<{ domain: string; headline: string | null; description: string | null; position: number }>
) {
  const resend = getResend()

  const competitorRows = competitors.length > 0
    ? competitors.map(c =>
        `<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin: 8px 0;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <strong style="font-family: monospace; font-size: 13px; color: #dc2626;">${escapeHtml(c.domain)}</strong>
            <span style="background: #eef2ff; color: #4f46e5; font-size: 11px; padding: 2px 8px; border-radius: 12px;">Position ${c.position}</span>
          </div>
          ${c.headline ? `<p style="margin: 4px 0 0; font-size: 13px; color: #111; font-weight: 600;">${escapeHtml(c.headline)}</p>` : ''}
          ${c.description ? `<p style="margin: 4px 0 0; font-size: 12px; color: #555;">${escapeHtml(c.description)}</p>` : ''}
        </div>`
      ).join('')
    : '<p style="color: #22c55e; font-size: 14px;">No competitors are currently bidding on this keyword.</p>'

  await resend.emails.send({
    from: 'SerpAlert <noreply@serpalert.co.uk>',
    to,
    subject: `Brand Audit: ${competitors.length} competitor${competitors.length !== 1 ? 's' : ''} found on "${escapeHtml(keyword)}"`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="font-size: 20px; color: #111;">Your Brand Audit Report</h1>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Here are the results for <strong>${escapeHtml(keyword)}</strong>. We found <strong>${competitors.length}</strong> competitor${competitors.length !== 1 ? 's' : ''} bidding on your brand keyword.
        </p>
        ${competitorRows}
        <p style="color: #555; font-size: 14px; line-height: 1.6; margin-top: 16px;">
          We'll send you weekly updates for the next 8 weeks so you can track changes.
        </p>
        <p style="margin-top: 24px;">
          <a href="https://serpalert.co.uk/sign-up" style="display: inline-block; background: #4f46e5; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
            Start 7-Day Free Trial
          </a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          SerpAlert — Brand keyword monitoring by <a href="https://sevenmarketing.co.uk" style="color: #999;">Seven Marketing</a>
        </p>
      </div>
    `,
  })
}

export async function sendWeeklyAuditEmail(
  to: string,
  keyword: string,
  competitors: Array<{ domain: string; headline: string | null; description: string | null; position: number }>,
  checksRemaining: number
) {
  const resend = getResend()

  const competitorRows = competitors.length > 0
    ? competitors.map(c =>
        `<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin: 8px 0;">
          <strong style="font-family: monospace; font-size: 13px; color: #dc2626;">${escapeHtml(c.domain)}</strong>
          <span style="background: #eef2ff; color: #4f46e5; font-size: 11px; padding: 2px 8px; border-radius: 12px; margin-left: 8px;">Position ${c.position}</span>
        </div>`
      ).join('')
    : '<p style="color: #22c55e; font-size: 14px;">No competitors found this week.</p>'

  const finalCheckNote = checksRemaining <= 1
    ? `<div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; margin: 16px 0;">
        <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600;">This is your last free weekly check.</p>
        <p style="margin: 4px 0 0; font-size: 13px; color: #92400e;">Start a free trial to continue monitoring with hourly checks and instant alerts.</p>
      </div>`
    : `<p style="color: #999; font-size: 12px;">${checksRemaining} weekly check${checksRemaining !== 1 ? 's' : ''} remaining on your free audit.</p>`

  await resend.emails.send({
    from: 'SerpAlert <noreply@serpalert.co.uk>',
    to,
    subject: `Weekly Update: ${competitors.length} competitor${competitors.length !== 1 ? 's' : ''} on "${escapeHtml(keyword)}"`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="font-size: 20px; color: #111;">Weekly Brand Check</h1>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Your weekly check for <strong>${escapeHtml(keyword)}</strong> found <strong>${competitors.length}</strong> competitor${competitors.length !== 1 ? 's' : ''}.
        </p>
        ${competitorRows}
        ${finalCheckNote}
        <p style="margin-top: 24px;">
          <a href="https://serpalert.co.uk/sign-up" style="display: inline-block; background: #4f46e5; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
            Start 7-Day Free Trial
          </a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          SerpAlert — Brand keyword monitoring by <a href="https://sevenmarketing.co.uk" style="color: #999;">Seven Marketing</a>
        </p>
      </div>
    `,
  })
}

export async function sendAuditMonitoringEndedEmail(to: string, keyword: string) {
  const resend = getResend()
  await resend.emails.send({
    from: 'SerpAlert <noreply@serpalert.co.uk>',
    to,
    subject: `Free monitoring ended for "${escapeHtml(keyword)}"`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="font-size: 20px; color: #111;">Your free monitoring has ended</h1>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Your 8 weeks of free weekly checks for <strong>${escapeHtml(keyword)}</strong> have finished.
        </p>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Competitors can start bidding on your brand at any time. Start a free trial to get hourly monitoring with instant alerts — so you never miss a threat.
        </p>
        <p style="margin-top: 24px;">
          <a href="https://serpalert.co.uk/sign-up" style="display: inline-block; background: #4f46e5; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
            Start Your Free Trial
          </a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          SerpAlert — Brand keyword monitoring by <a href="https://sevenmarketing.co.uk" style="color: #999;">Seven Marketing</a>
        </p>
      </div>
    `,
  })
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
