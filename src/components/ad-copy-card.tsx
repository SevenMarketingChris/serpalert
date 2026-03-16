import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CompetitorAd } from '@/lib/db/schema'

export function AdCopyCard({ ads }: { ads: CompetitorAd[] }) {
  if (ads.length === 0) return null
  return (
    <div className="space-y-2">
      {ads.map(ad => (
        <Card key={ad.id} className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-1 pt-3 px-4">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">Ad</Badge>
              <span className="text-xs text-muted-foreground">{ad.displayUrl ?? ad.domain}</span>
            </div>
            <p className="text-sm font-semibold text-blue-700">{ad.headline}</p>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xs text-gray-600">{ad.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
