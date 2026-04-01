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
  alertConfig?: string | null
}

export function AlertConfigForm({ brandId, slackWebhookUrl, alertConfig }: Props) {
  const parsedConfig = alertConfig ? (() => { try { return JSON.parse(alertConfig) } catch (e) { console.warn('Failed to parse alertConfig JSON:', e instanceof Error ? e.message : 'Unknown error'); return {} } })() : {}
  const initialThreshold = parsedConfig.alertThreshold ?? 1
  const [state, formAction, isPending] = useActionState<SettingsState, FormData>(
    (prev, formData) => updateAlertConfig(prev, formData, brandId),
    null,
  )

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 font-mono">Alert Configuration</h3>
        <p className="text-sm text-gray-500 mt-1">
          Get notified instantly when competitors start bidding on your brand keywords. Configure where and when you receive alerts.
        </p>
      </div>
      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="slackWebhookUrl">Slack Webhook URL</Label>
          <Input
            id="slackWebhookUrl"
            name="slackWebhookUrl"
            defaultValue={slackWebhookUrl}
            placeholder="https://hooks.slack.com/..."
          />
          <p className="text-[11px] text-gray-400">
            Paste a Slack incoming webhook URL to receive real-time alerts in your chosen Slack channel. To create one, go to your Slack workspace &gt; Apps &gt; Incoming Webhooks &gt; Add to Slack. Leave blank to disable Slack alerts.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="alertThreshold">Alert Threshold</Label>
          <Input
            id="alertThreshold"
            name="alertThreshold"
            type="number"
            min={1}
            defaultValue={initialThreshold}
            placeholder="1"
          />
          <p className="text-[11px] text-gray-400">
            The minimum number of competitors that must be detected before an alert is sent. Set to 1 to be notified about every competitor, or increase to reduce noise if you only care about multiple competitors bidding simultaneously.
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
