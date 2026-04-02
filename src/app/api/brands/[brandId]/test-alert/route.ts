import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBrandById } from '@/lib/db/queries'
import { checkIsAdmin, authorizeBrandAccess, checkIsAgencyAdmin } from '@/lib/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request, { params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params
  if (!UUID_RE.test(brandId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [brand, isAdmin] = await Promise.all([
    getBrandById(brandId),
    checkIsAdmin(),
  ])
  if (!brand) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { agencyId: userAgencyId } = await checkIsAgencyAdmin()
  try {
    authorizeBrandAccess(brand, userId, isAdmin, userAgencyId)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { type: 'slack' | 'email'; webhookUrl?: string; email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (body.type === 'slack') {
    const webhookUrl = body.webhookUrl
    if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/')) {
      return NextResponse.json({ error: 'Invalid Slack webhook URL' }, { status: 400 })
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'error',
        body: JSON.stringify({
          blocks: [
            {
              type: 'header',
              text: { type: 'plain_text', text: '🧪 SerpAlert Test Alert', emoji: true },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `This is a test alert for *${brand.name}*. If you can see this, Slack alerts are working correctly!`,
              },
            },
            {
              type: 'context',
              elements: [
                { type: 'mrkdwn', text: `Sent from SerpAlert at ${new Date().toLocaleString('en-GB')}` },
              ],
            },
          ],
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        return NextResponse.json({ error: `Slack returned: ${text}` }, { status: 400 })
      }

      return NextResponse.json({ success: true, message: 'Test alert sent to Slack' })
    } catch (err) {
      return NextResponse.json({ error: `Failed to reach Slack: ${err instanceof Error ? err.message : 'Unknown error'}` }, { status: 500 })
    }
  }

  if (body.type === 'email') {
    const email = body.email
    if (!email) {
      return NextResponse.json({ error: 'No email address provided' }, { status: 400 })
    }

    try {
      const { Resend } = await import('resend')
      const key = process.env.RESEND_API_KEY
      if (!key) return NextResponse.json({ error: 'Email not configured' }, { status: 500 })
      const resend = new Resend(key)
      await resend.emails.send({
        from: 'SerpAlert <noreply@serpalert.co.uk>',
        replyTo: 'support@serpalert.co.uk',
        to: email,
        subject: `Test Alert — ${brand.name}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
            <h1 style="font-size: 20px; color: #111;">🧪 Test Alert</h1>
            <p style="color: #555; font-size: 14px; line-height: 1.6;">
              This is a test email alert for <strong>${brand.name}</strong>. If you received this, email alerts are working correctly!
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">
              Sent from SerpAlert at ${new Date().toLocaleString('en-GB')}
            </p>
          </div>
        `,
      })

      return NextResponse.json({ success: true, message: `Test email sent to ${email}` })
    } catch (err) {
      return NextResponse.json({ error: `Failed to send email: ${err instanceof Error ? err.message : 'Unknown error'}` }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Invalid type — must be "slack" or "email"' }, { status: 400 })
}
