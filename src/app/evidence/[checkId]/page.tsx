import { notFound } from 'next/navigation'
import { getSerpCheckWithAds } from '@/lib/db/queries'
import { CopyLinkButton } from '@/components/copy-link-button'

function formatDateTime(date: Date): string {
  const d = new Date(date)
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default async function EvidencePage({
  params,
  searchParams,
}: {
  params: Promise<{ checkId: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { checkId } = await params
  const { token } = await searchParams

  const result = await getSerpCheckWithAds(checkId)
  if (!result) notFound()

  const { check, ads } = result

  // Open access — no auth required
  const hasAccess = true

  if (!hasAccess) notFound()

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Logo */}
        <div className="text-center">
          <span className="text-gradient-tech font-extrabold text-lg">SerpAlert</span>
        </div>

        {/* Evidence Card */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h1 className="font-semibold text-lg">Evidence Report</h1>

          {/* Screenshot */}
          {check.screenshotUrl && (
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={check.screenshotUrl}
                alt={`SERP screenshot for ${check.keyword}`}
                className="w-full rounded-lg"
              />
              <span className="absolute bottom-2 right-2 bg-black/70 text-white font-mono text-xs px-2 py-1 rounded">
                {formatDateTime(check.checkedAt)}
              </span>
            </div>
          )}

          {/* Ads */}
          <div className="space-y-3">
            {ads.map((ad) => (
              <div key={ad.id} className="border border-border rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-sm">{ad.domain}</span>
                  {ad.position != null && (
                    <span className="bg-tech-purple/10 text-tech-purple text-xs font-mono px-2 py-0.5 rounded">
                      Position {ad.position}
                    </span>
                  )}
                </div>
                {ad.headline && (
                  <p className="text-primary text-sm">{ad.headline}</p>
                )}
                {ad.description && (
                  <p className="text-muted-foreground text-sm">{ad.description}</p>
                )}
                {ad.displayUrl && (
                  <p className="font-mono text-xs text-muted-foreground">{ad.displayUrl}</p>
                )}
              </div>
            ))}
          </div>

          {/* Metadata */}
          <div className="border-t border-border pt-3 space-y-1 text-sm text-muted-foreground">
            <p><span className="font-semibold text-foreground">Keyword:</span> {check.keyword}</p>
            <p><span className="font-semibold text-foreground">Date/Time:</span> {formatDateTime(check.checkedAt)}</p>
            <p><span className="font-semibold text-foreground">Location:</span> United Kingdom</p>
            <p><span className="font-semibold text-foreground">Device:</span> Desktop</p>
          </div>
        </div>

        {/* Copy Link */}
        <CopyLinkButton checkId={checkId} />

        {/* Footer */}
        <p className="text-center text-muted-foreground text-xs">
          Protected by SerpAlert
        </p>
      </div>
    </div>
  )
}
