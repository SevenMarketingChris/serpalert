import { NextResponse } from 'next/server'
import { isCronRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { auditLeads } from '@/lib/db/schema'
import { checkSerpForAds } from '@/lib/serpapi'
import { sendWeeklyAuditEmail, sendAuditMonitoringEndedEmail } from '@/lib/email'
import { eq, gt, and } from 'drizzle-orm'

export const maxDuration = 300

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all active audit leads with remaining checks
    const leads = await db
      .select()
      .from(auditLeads)
      .where(
        and(
          gt(auditLeads.weeklyChecksRemaining, 0),
          eq(auditLeads.unsubscribed, false)
        )
      )

    let processed = 0
    let errors = 0

    for (const lead of leads) {
      try {
        const competitors = await checkSerpForAds(lead.keyword)
        const newRemaining = lead.weeklyChecksRemaining - 1

        // Update the lead
        await db
          .update(auditLeads)
          .set({
            weeklyChecksRemaining: newRemaining,
            lastCheckedAt: new Date(),
            competitorCount: competitors.length,
          })
          .where(eq(auditLeads.id, lead.id))

        if (newRemaining > 0) {
          // Send weekly update
          await sendWeeklyAuditEmail(
            lead.email,
            lead.keyword,
            competitors,
            newRemaining
          )
        } else {
          // Final check — send monitoring ended email
          await sendAuditMonitoringEndedEmail(lead.email, lead.keyword)
        }

        processed++
      } catch (err) {
        console.error(`Weekly audit failed for ${lead.email} / ${lead.keyword}:`, err)
        errors++
      }
    }

    return NextResponse.json({
      total: leads.length,
      processed,
      errors,
    })
  } catch (err) {
    console.error('Weekly audit cron failed:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
