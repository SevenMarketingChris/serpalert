'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { updateGoogleAds, type SettingsState } from './actions'

interface Props {
  brandId: string
  googleAdsCustomerId: string
  brandCampaignId: string
}

export function GoogleAdsForm({ brandId, googleAdsCustomerId, brandCampaignId }: Props) {
  const [state, formAction, isPending] = useActionState<SettingsState, FormData>(updateGoogleAds, null)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 font-mono">Google Ads</h3>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="brandId" value={brandId} />

        <div className="space-y-1.5">
          <Label htmlFor="googleAdsCustomerId">Google Ads Customer ID</Label>
          <Input
            id="googleAdsCustomerId"
            name="googleAdsCustomerId"
            defaultValue={googleAdsCustomerId}
            placeholder="123-456-7890"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="brandCampaignId">Brand Campaign ID</Label>
          <Input
            id="brandCampaignId"
            name="brandCampaignId"
            defaultValue={brandCampaignId}
            placeholder="e.g. 12345678"
          />
          <p className="text-[11px] text-gray-400">
            The Google Ads campaign ID for your brand campaign. SerpAlert will automatically enable this campaign when competitors are detected and pause it when clear.
          </p>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Google Ads Settings'}
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
