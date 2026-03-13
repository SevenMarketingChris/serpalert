import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AdCopyCard } from './ad-copy-card'
import { ScreenshotModal } from './screenshot-modal'
import type { SerpCheck, CompetitorAd } from '@/lib/db/schema'

type CheckWithAds = SerpCheck & { ads: CompetitorAd[] }

export function CompetitorTimeline({ checks }: { checks: CheckWithAds[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Keyword</TableHead>
          <TableHead>Result</TableHead>
          <TableHead>Ad Copy</TableHead>
          <TableHead>Screenshot</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {checks.map(check => (
          <TableRow key={check.id}>
            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(check.checkedAt).toLocaleString('en-GB')}
            </TableCell>
            <TableCell className="text-sm">{check.keyword}</TableCell>
            <TableCell>
              {check.competitorCount === 0
                ? <Badge variant="outline" className="text-green-600 border-green-300">None</Badge>
                : <Badge variant="destructive">{check.competitorCount} found</Badge>}
            </TableCell>
            <TableCell className="max-w-xs">
              {check.ads.length > 0 && <AdCopyCard ads={check.ads} />}
            </TableCell>
            <TableCell>
              <ScreenshotModal screenshotUrl={check.screenshotUrl} keyword={check.keyword} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
