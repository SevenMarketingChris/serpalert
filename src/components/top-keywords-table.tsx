'use client'

export function TopKeywordsTable({ keywords, domain }: { keywords: any[]; domain: string }) {
  if (!keywords.length) return <p className="text-sm text-muted-foreground">No keyword data for {domain} yet.</p>
  return (
    <div className="text-sm text-muted-foreground">
      <p>Top organic keywords coming soon.</p>
    </div>
  )
}
