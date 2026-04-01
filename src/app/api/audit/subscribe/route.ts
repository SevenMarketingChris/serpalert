import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auditLeads } from '@/lib/db/schema'
import { sendAuditReportEmail } from '@/lib/email'
import { checkSerpForAds } from '@/lib/serpapi'
import { and, eq } from 'drizzle-orm'
import { readAttributionContextFromRequest } from '@/lib/attribution'
import { emitServerAnalyticsEvent } from '@/lib/analytics/server'

export async function POST(request: Request) {
  const attribution = readAttributionContextFromRequest(request)
  const requestUrl = new URL(request.url)
  let email: string
  let keyword: string
  let competitorCount: number

  try {
    const body = await request.json()
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    keyword = typeof body.keyword === 'string' ? body.keyword.trim() : ''
    competitorCount = typeof body.competitorCount === 'number' ? body.competitorCount : 0
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Basic validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }
  if (!keyword || keyword.length > 200) {
    return NextResponse.json({ error: 'Invalid keyword.' }, { status: 400 })
  }
  if (competitorCount < 0 || competitorCount > 100) {
    return NextResponse.json({ error: 'competitorCount must be between 0 and 100.' }, { status: 400 })
  }

  try {
    const firstTouch = attribution.firstTouch ? JSON.stringify(attribution.firstTouch) : null
    const lastTouch = attribution.lastTouch ? JSON.stringify(attribution.lastTouch) : null

    // Upsert lead to keep attribution fresh and capture current competitor count.
    await db
      .insert(auditLeads)
      .values({
        email,
        keyword,
        competitorCount,
        anonymousId: attribution.anonymousId === 'unknown' ? null : attribution.anonymousId,
        sessionId: attribution.sessionId === 'unknown' ? null : attribution.sessionId,
        firstTouch,
        lastTouch,
      })
      .onConflictDoUpdate({
        target: [auditLeads.email, auditLeads.keyword],
        set: {
          competitorCount,
          anonymousId: attribution.anonymousId === 'unknown' ? undefined : attribution.anonymousId,
          sessionId: attribution.sessionId === 'unknown' ? undefined : attribution.sessionId,
          firstTouch: firstTouch ?? undefined,
          lastTouch: lastTouch ?? undefined,
          unsubscribed: false,
        },
      })

    const leadRows = await db
      .select({ id: auditLeads.id })
      .from(auditLeads)
      .where(and(eq(auditLeads.email, email), eq(auditLeads.keyword, keyword)))
      .limit(1)

    // Fetch fresh competitor data for the email report
    const competitors = await checkSerpForAds(keyword)

    // Send full report email
    await sendAuditReportEmail(email, keyword, competitors)

    await emitServerAnalyticsEvent({
      name: 'audit_report_requested',
      path: requestUrl.pathname,
      url: request.url,
      leadId: leadRows[0]?.id,
      properties: {
        keywordLength: keyword.length,
        competitorCount,
      },
    }, attribution)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Audit subscribe failed:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
