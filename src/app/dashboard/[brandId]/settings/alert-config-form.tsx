'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { updateAlertConfig, type SettingsState } from './actions'

interface Props {
  brandId: string
  slackWebhookUrl: string
}

export function AlertConfigForm({ brandId, slackWebhookUrl }: Props) {
  const [state, formAction, isPending] = useActionState<SettingsState, FormData>(updateAlertConfig, null)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 font-mono">Alert Configuration</h3>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="brandId" value={brandId} />

        <div className="space-y-1.5">
          <Label htmlFor="slackWebhookUrl">Slack Webhook URL</Label>
          <Input
            id="slackWebhookUrl"
            name="slackWebhookUrl"
            defaultValue={slackWebhookUrl}
            placeholder="https://hooks.slack.com/..."
          />
          <p className="text-[11px] text-gray-400">
            Receive alerts in Slack when competitors are detected on your brand keywords.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="alertThreshold">Alert Threshold</Label>
          <Input
            id="alertThreshold"
            name="alertThreshold"
            type="number"
            min={1}
            defaultValue={1}
            placeholder="1"
          />
          <p className="text-[11px] text-gray-400">
            Only alert when this many or more competitors are detected.
          </p>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Alert Settings'}
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
