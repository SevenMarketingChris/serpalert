'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { updateAdminSettings, type SettingsState } from './actions'

interface Props {
  brandId: string
  monthlyBrandSpend: string
  brandRoas: string
  watchlistDomains: string
  active: boolean
}

export function AdminSettingsForm({
  brandId,
  monthlyBrandSpend,
  brandRoas,
  watchlistDomains,
  active,
}: Props) {
  const [state, formAction, isPending] = useActionState<SettingsState, FormData>(
    (prev, formData) => updateAdminSettings(prev, formData, brandId),
    null,
  )

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg shadow-gray-200/20 space-y-4">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 font-mono">Admin Settings</h3>
        <p className="text-sm text-gray-500 mt-1">
          Advanced settings for agency administrators. These control monitoring behaviour, financial data used in ROI calculations, and competitor watchlists.
        </p>
      </div>
      <form action={formAction} className="space-y-4">

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="active"
            name="active"
            defaultChecked={active}
            className="h-4 w-4 rounded border-gray-300"
          />
          <div>
            <Label htmlFor="active">Active Monitoring</Label>
            <p className="text-[11px] text-gray-400">
              When enabled, SerpAlert runs scheduled SERP checks for this brand. Disable to pause monitoring without deleting the brand or its data.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="monthlyBrandSpend">Monthly Brand Spend (GBP)</Label>
          <Input
            id="monthlyBrandSpend"
            name="monthlyBrandSpend"
            type="number"
            step="0.01"
            defaultValue={monthlyBrandSpend}
            placeholder="0.00"
          />
          <p className="text-[11px] text-gray-400">
            How much this brand currently spends per month on brand keyword campaigns in Google Ads. Used to calculate potential savings in the budget redirect calculator on the homepage.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="brandRoas">Brand ROAS</Label>
          <Input
            id="brandRoas"
            name="brandRoas"
            type="number"
            step="0.01"
            defaultValue={brandRoas}
            placeholder="0.00"
          />
          <p className="text-[11px] text-gray-400">
            The return on ad spend for brand campaigns (e.g. 6.0 means every 1 GBP spent returns 6 GBP in revenue). Used alongside monthly spend for ROI calculations.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="watchlistDomains">Competitor Watchlist</Label>
          <Input
            id="watchlistDomains"
            name="watchlistDomains"
            aria-describedby="watchlist-help"
            defaultValue={watchlistDomains}
            placeholder="rival.com, competitor.co.uk"
          />
          <p id="watchlist-help" className="text-[11px] text-gray-400">
            Comma-separated list of competitor domains to prioritise. When these specific domains appear in SERP checks, they&apos;ll be flagged with higher priority in alerts and reports. Useful for tracking known competitors.
          </p>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Admin Settings'}
        </Button>

        {state?.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state?.success && (
          <Alert>
            <AlertDescription>{state.success}</AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  )
}
