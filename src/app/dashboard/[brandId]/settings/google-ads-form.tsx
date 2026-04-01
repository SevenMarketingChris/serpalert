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
  const [state, formAction, isPending] = useActionState<SettingsState, FormData>(
    (prev, formData) => updateGoogleAds(prev, formData, brandId),
    null,
  )

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg shadow-gray-200/20 space-y-4">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 font-mono">Google Ads Integration</h3>
        <p className="text-sm text-gray-500 mt-1">
          Connect your Google Ads account to enable automatic brand campaign toggling. When a competitor is detected, SerpAlert can automatically enable your brand campaign to defend your position — and pause it when the coast is clear, saving you budget.
        </p>
      </div>
      <form action={formAction} className="space-y-4">

        <div className="space-y-1.5">
          <Label htmlFor="googleAdsCustomerId">Google Ads Customer ID</Label>
          <Input
            id="googleAdsCustomerId"
            name="googleAdsCustomerId"
            aria-describedby="gads-id-help"
            defaultValue={googleAdsCustomerId}
            placeholder="123-456-7890"
          />
          <p id="gads-id-help" className="text-[11px] text-gray-400">
            Your Google Ads account ID in the format 123-456-7890. Find it in the top-right corner of your Google Ads dashboard. This connects SerpAlert to your ad account for campaign automation and auction insights.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="brandCampaignId">Brand Campaign ID</Label>
          <Input
            id="brandCampaignId"
            name="brandCampaignId"
            aria-describedby="campaign-id-help"
            defaultValue={brandCampaignId}
            placeholder="e.g. 12345678"
          />
          <p id="campaign-id-help" className="text-[11px] text-gray-400">
            The numeric ID of your brand campaign in Google Ads. Find it by clicking your brand campaign — the ID is in the URL. When set, SerpAlert will automatically enable this campaign when competitors are detected bidding on your brand, and pause it when no competitors are found — so you only spend on brand defence when you need to.
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
