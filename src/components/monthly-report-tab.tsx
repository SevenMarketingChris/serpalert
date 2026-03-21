'use client'

export function MonthlyReportTab({ reports, brandDomain }: { reports: any[]; brandDomain: string }) {
  if (!reports.length) return <p className="text-sm text-muted-foreground">No monthly reports for {brandDomain} yet.</p>
  return (
    <div className="text-sm text-muted-foreground">
      <p>Monthly SEO reports coming soon.</p>
    </div>
  )
}
