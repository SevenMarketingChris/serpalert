'use client'

export function SeoMetricsPanel({ brandMetrics, brandDomain }: { brandMetrics: any; brandDomain: string }) {
  if (!brandMetrics) return <p className="text-sm text-muted-foreground">No SEO data available yet.</p>
  return (
    <div className="text-sm text-muted-foreground">
      <p>SEO metrics for <span className="font-mono text-foreground">{brandDomain}</span> coming soon.</p>
    </div>
  )
}
