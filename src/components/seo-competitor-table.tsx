'use client'

export function SeoCompetitorTable({ competitors }: { competitors: any[] }) {
  if (!competitors.length) return <p className="text-sm text-muted-foreground">No competitor SEO data yet.</p>
  return (
    <div className="text-sm text-muted-foreground">
      <p>Competitor SEO comparison coming soon.</p>
    </div>
  )
}
