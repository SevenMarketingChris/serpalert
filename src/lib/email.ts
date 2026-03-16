import { Resend } from 'resend'

export async function sendMonthlyReport(params: {
  to: string
  brandName: string
  agencyName: string | null
  clientToken: string
  period: string
  totalScans: number
  checksWithCompetitors: number
  activeCompetitors: number
  totalCompetitors: number
  spend: number | null
  roas: number | null
  topCompetitors: { domain: string; appearances: number; isEscalating: boolean }[]
}): Promise<void> {
  const {
    to, brandName, agencyName, clientToken, period,
    totalScans, checksWithCompetitors, activeCompetitors, totalCompetitors,
    spend, roas, topCompetitors,
  } = params

  const senderName = agencyName ?? 'SerpAlert'
  const exposureRate = totalScans > 0 ? Math.round((checksWithCompetitors / totalScans) * 100) : 0
  const dashboardUrl = `${process.env.NEXTAUTH_URL ?? 'https://serpalert.com'}/client/${clientToken}`

  let verdictText = ''
  let verdictColor = '#636360'
  if (totalScans === 0) {
    verdictText = 'No scan data available yet.'
  } else if (exposureRate === 0) {
    verdictText = `No competitors detected across ${totalScans} scans — brand campaign may be unnecessary.`
    verdictColor = '#59D499'
  } else if (exposureRate < 15) {
    verdictText = `Low activity: ${exposureRate}% exposure rate across ${totalScans} scans. Consider reducing budget.`
    verdictColor = '#FFB340'
  } else {
    verdictText = `Competitors actively bidding: ${exposureRate}% of ${totalScans} scans had competitor ads. Campaign is justified.`
    verdictColor = '#E54D42'
  }

  const fmt = (n: number) => `£${n.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F7F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;padding:0 16px 48px;">

    <!-- Header -->
    <div style="margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#9A9A97;">${senderName} · Monthly Brand Protection Report</p>
      <h1 style="margin:4px 0 0;font-size:22px;font-weight:700;color:#1A1A18;">${brandName}</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#6B6B68;">${period}</p>
    </div>

    <!-- Verdict -->
    <div style="background:#FFFFFF;border:1px solid #E5E5E3;border-radius:12px;padding:18px 20px;margin-bottom:16px;border-left:3px solid ${verdictColor};">
      <p style="margin:0;font-size:14px;color:#1A1A18;line-height:1.5;">${verdictText}</p>
    </div>

    <!-- Stats grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
      <div style="background:#FFFFFF;border:1px solid #E5E5E3;border-radius:10px;padding:14px 16px;">
        <p style="margin:0 0 4px;font-size:10px;font-weight:600;color:#9A9A97;text-transform:uppercase;letter-spacing:0.05em;">Total Scans</p>
        <p style="margin:0;font-size:26px;font-weight:700;color:#1A1A18;line-height:1;">${totalScans}</p>
        <p style="margin:3px 0 0;font-size:11px;color:#9A9A97;">${exposureRate}% exposure rate</p>
      </div>
      <div style="background:#FFFFFF;border:1px solid #E5E5E3;border-radius:10px;padding:14px 16px;">
        <p style="margin:0 0 4px;font-size:10px;font-weight:600;color:#9A9A97;text-transform:uppercase;letter-spacing:0.05em;">Active Competitors</p>
        <p style="margin:0;font-size:26px;font-weight:700;color:#1A1A18;line-height:1;">${activeCompetitors}</p>
        <p style="margin:3px 0 0;font-size:11px;color:#9A9A97;">${totalCompetitors} total observed</p>
      </div>
      ${spend != null && roas != null ? `
      <div style="background:#FFFFFF;border:1px solid #E5E5E3;border-radius:10px;padding:14px 16px;">
        <p style="margin:0 0 4px;font-size:10px;font-weight:600;color:#9A9A97;text-transform:uppercase;letter-spacing:0.05em;">Monthly Spend</p>
        <p style="margin:0;font-size:26px;font-weight:700;color:#1A1A18;line-height:1;">${fmt(spend)}</p>
        <p style="margin:3px 0 0;font-size:11px;color:#9A9A97;">brand campaign</p>
      </div>
      <div style="background:#FFFFFF;border:1px solid #E5E5E3;border-radius:10px;padding:14px 16px;">
        <p style="margin:0 0 4px;font-size:10px;font-weight:600;color:#9A9A97;text-transform:uppercase;letter-spacing:0.05em;">Revenue Protected</p>
        <p style="margin:0;font-size:26px;font-weight:700;color:#59D499;line-height:1;">${fmt(spend * roas)}</p>
        <p style="margin:3px 0 0;font-size:11px;color:#9A9A97;">at ${roas}× ROAS</p>
      </div>
      ` : ''}
    </div>

    <!-- Top competitors -->
    ${topCompetitors.length > 0 ? `
    <div style="background:#FFFFFF;border:1px solid #E5E5E3;border-radius:10px;overflow:hidden;margin-bottom:16px;">
      <div style="padding:12px 16px;border-bottom:1px solid #E5E5E3;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#1A1A18;">Competitor Activity</p>
      </div>
      ${topCompetitors.slice(0, 5).map(c => `
      <div style="padding:10px 16px;border-bottom:1px solid #F2F2F0;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:8px;">
          <img src="https://www.google.com/s2/favicons?domain=${c.domain}&sz=16" alt="" style="width:14px;height:14px;" />
          <span style="font-size:13px;color:#1A1A18;">${c.domain}</span>
          ${c.isEscalating ? '<span style="font-size:11px;color:#E54D42;font-weight:600;">↑ Escalating</span>' : ''}
        </div>
        <span style="font-size:12px;color:#6B6B68;">${c.appearances} detections</span>
      </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${dashboardUrl}" style="display:inline-block;background:#FF6B35;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;">View Full Dashboard →</a>
    </div>

    <!-- Footer -->
    <p style="margin:0;font-size:11px;color:#C5C5C2;text-align:center;">
      Monitored 3× daily via Google SERP scanning · ${senderName}
      <br>You received this because a report email is configured for ${brandName}.
      <br><a href="${dashboardUrl}" style="color:#C5C5C2;text-decoration:underline;">View dashboard</a> &nbsp;·&nbsp; To stop these reports, reply to this email and ask your account manager to remove your address.
    </p>
  </div>
</body>
</html>`

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: `${senderName} <reports@serpalert.com>`,
    to,
    subject: `${brandName} — Brand Protection Report · ${period}`,
    html,
  })
}
