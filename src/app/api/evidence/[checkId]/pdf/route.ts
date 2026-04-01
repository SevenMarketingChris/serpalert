import { NextResponse } from 'next/server'
import { getSerpCheckWithAds, getBrandById } from '@/lib/db/queries'
import { safeCompare } from '@/lib/auth'
import { escapeHtml } from '@/lib/utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ checkId: string }> }
) {
  const { checkId } = await params
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(checkId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }
  const token = new URL(request.url).searchParams.get('token')

  // Validate token pattern BEFORE any DB fetch
  if (!token || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await getSerpCheckWithAds(checkId)
  if (!result || !safeCompare(token, result.brandClientToken)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { check, ads } = result

  const brand = await getBrandById(check.brandId)
  const brandName = brand?.name ?? 'Unknown Brand'
  const checkDate = new Date(check.checkedAt).toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Evidence Report — ${brandName}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    .meta { color: #666; font-size: 13px; margin-bottom: 32px; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 12px; background: #f5f5f5; border: 1px solid #e0e0e0; font-weight: 600; }
    td { padding: 8px 12px; border: 1px solid #e0e0e0; }
    .ad-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .ad-domain { font-weight: 700; font-size: 14px; }
    .ad-headline { color: #1a0dab; font-size: 15px; margin-top: 4px; }
    .ad-desc { color: #555; font-size: 13px; margin-top: 4px; }
    .ad-url { color: #006621; font-size: 12px; font-family: monospace; margin-top: 4px; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e0e0e0; color: #888; font-size: 11px; }
    ${check.screenshotUrl ? '.screenshot { max-width: 100%; border: 1px solid #e0e0e0; border-radius: 4px; margin-top: 16px; }' : ''}
  </style>
</head>
<body>
  <h1>Brand Protection Evidence Report</h1>
  <p class="meta">${brandName} · ${checkDate}</p>

  <div class="section">
    <h2>Check Details</h2>
    <table>
      <tr><th>Keyword</th><td>${escapeHtml(check.keyword)}</td></tr>
      <tr><th>Date & Time</th><td>${checkDate}</td></tr>
      <tr><th>Location</th><td>United Kingdom</td></tr>
      <tr><th>Device</th><td>Desktop</td></tr>
      <tr><th>Competitors Found</th><td>${check.competitorCount}</td></tr>
    </table>
  </div>

  ${ads.length > 0 ? `
  <div class="section">
    <h2>Competitor Ads Detected</h2>
    ${ads.map(ad => `
      <div class="ad-card">
        <div class="ad-domain">${escapeHtml(ad.domain)}${ad.position != null ? ` · Position ${ad.position}` : ''}</div>
        ${ad.headline ? `<div class="ad-headline">${escapeHtml(ad.headline)}</div>` : ''}
        ${ad.description ? `<div class="ad-desc">${escapeHtml(ad.description)}</div>` : ''}
        ${ad.displayUrl ? `<div class="ad-url">${escapeHtml(ad.displayUrl)}</div>` : ''}
      </div>
    `).join('')}
  </div>
  ` : `
  <div class="section">
    <h2>Result</h2>
    <p>No competitor ads were detected for this keyword at the time of checking.</p>
  </div>
  `}

  ${check.screenshotUrl ? `
  <div class="section">
    <h2>SERP Screenshot</h2>
    <img src="${escapeHtml(check.screenshotUrl ?? '')}" alt="SERP screenshot" class="screenshot" />
  </div>
  ` : ''}

  <div class="footer">
    <p>This report was generated automatically. The data reflects the state of Google search results at the time of the check.</p>
    <p>Report ID: ${check.id} · Generated: ${new Date().toLocaleString('en-GB')}</p>
  </div>
</body>
</html>
  `

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="evidence-${check.keyword}-${check.id.slice(0, 8)}.html"`,
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src https://*.public.blob.vercel-storage.com; frame-ancestors 'none'",
    },
  })
}
