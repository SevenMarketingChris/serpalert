import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { getBrandById, getRecentSerpChecks, getCompetitorAdsForChecks, getCompetitorSummaryForBrand } from '@/lib/db/queries'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ brandId: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { brandId } = await params
  const brand = await getBrandById(brandId)
  if (!brand) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get last 24h of data
  const checks = await getRecentSerpChecks(brandId, 100)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const todayChecks = checks.filter(c => new Date(c.checkedAt) >= oneDayAgo)
  const allAds = await getCompetitorAdsForChecks(todayChecks.map(c => c.id))
  const competitors = await getCompetitorSummaryForBrand(brandId)

  const threatsToday = todayChecks.filter(c => c.competitorCount > 0).length
  const uniqueCompetitors = new Set(allAds.map(a => a.domain)).size
  const totalChecks = todayChecks.length

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="font-size: 20px; margin: 0;">${brand.name}</h1>
    <p style="color: #888; font-size: 13px; margin: 4px 0;">Daily Brand Protection Digest · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  </div>

  <div style="background: ${threatsToday > 0 ? '#fef2f2' : '#ecfdf5'}; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
    <p style="font-size: 24px; font-weight: 800; margin: 0; color: ${threatsToday > 0 ? '#dc2626' : '#10b981'};">
      ${threatsToday > 0 ? `${uniqueCompetitors} Competitor${uniqueCompetitors !== 1 ? 's' : ''} Found` : 'Brand Clear'}
    </p>
    <p style="color: #888; font-size: 13px; margin: 4px 0;">
      ${totalChecks} scans completed in the last 24 hours
    </p>
  </div>

  ${competitors.length > 0 ? `
  <div style="margin-bottom: 24px;">
    <h2 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Active Competitors</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="background: #f9fafb;">
        <th style="text-align: left; padding: 8px;">Domain</th>
        <th style="text-align: right; padding: 8px;">Last 30d</th>
        <th style="text-align: right; padding: 8px;">Avg Pos</th>
      </tr>
      ${competitors.slice(0, 5).map(c => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 8px; font-weight: 600;">${c.domain}</td>
        <td style="padding: 8px; text-align: right;">${c.recentCount}</td>
        <td style="padding: 8px; text-align: right;">${c.avgPosition ?? '—'}</td>
      </tr>
      `).join('')}
    </table>
  </div>
  ` : ''}

  <div style="text-align: center; margin-top: 32px;">
    <a href="https://serpalert.vercel.app/dashboard/${brandId}"
       style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
      View Full Dashboard
    </a>
  </div>

  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; color: #888; font-size: 11px; text-align: center;">
    <p>Monitoring ${brand.keywords.length} keywords · Next scan in ~1 hour</p>
  </div>
</body>
</html>
  `

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
