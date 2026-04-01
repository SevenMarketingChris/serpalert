import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auditLeads } from '@/lib/db/schema'
import { sendAuditReportEmail } from '@/lib/email'
import { checkSerpForAds } from '@/lib/serpapi'

export async function POST(request: Request) {
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

  try {
    // Upsert lead — on conflict (same email+keyword), just update the timestamp
    await db
      .insert(auditLeads)
      .values({
        email,
        keyword,
        competitorCount,
      })
      .onConflictDoNothing()

    // Fetch fresh competitor data for the email report
    const competitors = await checkSerpForAds(keyword)

    // Send full report email
    await sendAuditReportEmail(email, keyword, competitors)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Audit subscribe failed:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
