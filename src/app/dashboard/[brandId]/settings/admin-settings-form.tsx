'use client'

import { useActionState } from 'react'
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
  const [state, formAction, isPending] = useActionState<SettingsState, FormData>(updateAdminSettings, null)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 font-mono">Admin Settings</h3>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="brandId" value={brandId} />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active"
            name="active"
            defaultChecked={active}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="active">Active</Label>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="monthlyBrandSpend">Monthly Brand Spend</Label>
          <Input
            id="monthlyBrandSpend"
            name="monthlyBrandSpend"
            type="number"
            step="0.01"
            defaultValue={monthlyBrandSpend}
            placeholder="0.00"
          />
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
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="watchlistDomains">Competitor Watchlist</Label>
          <Input
            id="watchlistDomains"
            name="watchlistDomains"
            defaultValue={watchlistDomains}
            placeholder="rival.com, competitor.co.uk"
          />
          <p className="text-[11px] text-gray-400">
            Comma-separated domains to watch for. Get priority alerts when these specific competitors appear.
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
