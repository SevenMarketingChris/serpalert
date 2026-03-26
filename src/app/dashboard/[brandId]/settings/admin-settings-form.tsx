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
  googleAdsCustomerId: string
  slackWebhookUrl: string
  active: boolean
}

export function AdminSettingsForm({
  brandId,
  monthlyBrandSpend,
  brandRoas,
  googleAdsCustomerId,
  slackWebhookUrl,
  active,
}: Props) {
  const [state, formAction, isPending] = useActionState<SettingsState, FormData>(updateAdminSettings, null)

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground font-mono mb-4">
        Admin Settings
      </h3>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="brandId" value={brandId} />

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
          <Label htmlFor="googleAdsCustomerId">Google Ads Customer ID</Label>
          <Input
            id="googleAdsCustomerId"
            name="googleAdsCustomerId"
            defaultValue={googleAdsCustomerId}
            placeholder="123-456-7890"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slackWebhookUrl">Slack Webhook URL</Label>
          <Input
            id="slackWebhookUrl"
            name="slackWebhookUrl"
            defaultValue={slackWebhookUrl}
            placeholder="https://hooks.slack.com/..."
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active"
            name="active"
            defaultChecked={active}
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor="active">Active</Label>
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
