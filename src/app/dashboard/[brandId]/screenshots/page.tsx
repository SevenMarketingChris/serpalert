import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getBrandById, getScreenshotsForBrand } from '@/lib/db/queries'
import { DashboardTabs } from '@/components/dashboard-tabs'
import { Camera } from 'lucide-react'

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function ScreenshotsPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params

  const brand = await getBrandById(brandId)
  if (!brand) notFound()

  const screenshots = await getScreenshotsForBrand(brandId, 100)

  return (
    <div className="max-w-5xl space-y-4">
      <DashboardTabs brandId={brandId} hasGoogleAds={!!brand.googleAdsCustomerId} />

      {screenshots.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
            <Camera className="h-6 w-6" />
          </div>
          <p className="font-semibold text-foreground">No screenshots yet</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Screenshots are captured automatically during SERP checks. Run a manual check or wait for the next scheduled scan.
          </p>
        </div>
      ) : (() => {
        const groups = new Map<string, typeof screenshots>()
        for (const s of screenshots) {
          const dateKey = new Date(s.checkedAt).toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })
          if (!groups.has(dateKey)) groups.set(dateKey, [])
          groups.get(dateKey)!.push(s)
        }
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              {screenshots.length} screenshot{screenshots.length !== 1 ? 's' : ''}
            </p>

            {[...groups.entries()].map(([date, items]) => (
              <div key={date} className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{date}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((check) => (
                    <div
                      key={check.id}
                      className="bg-card border border-border rounded-lg overflow-hidden group"
                    >
                      {/* Screenshot image */}
                      <a
                        href={check.screenshotUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative aspect-video bg-muted overflow-hidden"
                      >
                        <Image
                          src={check.screenshotUrl!}
                          alt={`SERP screenshot for "${check.keyword}"`}
                          fill
                          className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </a>

                      {/* Metadata */}
                      <div className="p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="bg-primary/10 text-primary text-xs font-mono px-2 py-0.5 rounded">
                            {check.keyword}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-xs ${
                            check.competitorCount > 0
                              ? 'text-red-500'
                              : 'text-emerald-500'
                          }`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                              check.competitorCount > 0 ? 'bg-red-500' : 'bg-emerald-500'
                            }`} />
                            {check.competitorCount > 0
                              ? `${check.competitorCount} competitor${check.competitorCount !== 1 ? 's' : ''}`
                              : 'Clear'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {formatDateTime(check.checkedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      })()}
    </div>
  )
}
