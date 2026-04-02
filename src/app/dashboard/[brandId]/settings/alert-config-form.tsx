'use client'

import { useActionState, useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { updateAlertConfig, type SettingsState } from './actions'
import { X, Plus, Send } from 'lucide-react'

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

  // Slack webhooks — support multiple
  const initialWebhooks = slackWebhookUrl ? slackWebhookUrl.split(',').map(u => u.trim()).filter(Boolean) : []
  const [webhooks, setWebhooks] = useState<string[]>(initialWebhooks)
  const [newWebhook, setNewWebhook] = useState('')
  const [testingIndex, setTestingIndex] = useState<number | null>(null)
  const [emailTesting, setEmailTesting] = useState(false)
  const emailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state?.success) toast.success(state.success)
    if (state?.error) toast.error(state.error)
  }, [state])

  function addWebhook() {
    const url = newWebhook.trim()
    if (!url) return
    if (!url.startsWith('https://hooks.slack.com/')) { toast.error('URL must start with https://hooks.slack.com/'); return }
    if (webhooks.includes(url)) { toast.error('Webhook already added'); return }
    setWebhooks([...webhooks, url])
    setNewWebhook('')
    toast.success('Webhook added — save to apply')
  }

  function removeWebhook(url: string) {
    setWebhooks(webhooks.filter(w => w !== url))
    toast.success('Webhook removed — save to apply')
  }

  async function testSlack(url: string, index: number) {
    setTestingIndex(index)
    try {
      const res = await fetch(`/api/brands/${brandId}/test-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'slack', webhookUrl: url }),
      })
      const data = await res.json()
      if (res.ok) { toast.success(data.message || 'Test sent!') }
      else { toast.error(data.error || 'Test failed') }
    } catch { toast.error('Network error') }
    finally { setTestingIndex(null) }
  }

  async function testEmail() {
    const email = emailInputRef.current?.value?.trim()
    if (!email) { toast.error('Enter an email address first'); return }
    setEmailTesting(true)
    try {
      const res = await fetch(`/api/brands/${brandId}/test-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email', email }),
      })
      const data = await res.json()
      if (res.ok) { toast.success(data.message || 'Test email sent!') }
      else { toast.error(data.error || 'Email test failed') }
    } catch { toast.error('Network error') }
    finally { setEmailTesting(false) }
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg shadow-gray-200/20 space-y-4">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 font-mono">Alert Configuration</h3>
        <p className="text-sm text-gray-500 mt-1">
          Get notified instantly when competitors start bidding on your brand keywords. Configure where and when you receive alerts.
        </p>
      </div>
      <form action={formAction} className="space-y-4">
        <div className="space-y-3">
          <Label>Slack Webhooks</Label>

          {/* Hidden field sends comma-separated URLs to the server */}
          <input type="hidden" name="slackWebhookUrl" value={webhooks.join(',')} />

          {/* Current webhooks */}
          {webhooks.length > 0 && (
            <div className="space-y-2">
              {webhooks.map((url, i) => (
                <div key={url} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <span className="text-xs font-mono text-gray-600 truncate flex-1">{url.replace('https://hooks.slack.com/services/', '…/')}</span>
                  <button
                    type="button"
                    onClick={() => testSlack(url, i)}
                    disabled={testingIndex === i}
                    className="shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" />
                    {testingIndex === i ? 'Sending...' : 'Test'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeWebhook(url)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new webhook */}
          <div className="flex gap-2">
            <Input
              value={newWebhook}
              onChange={e => setNewWebhook(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addWebhook() } }}
              placeholder="https://hooks.slack.com/services/..."
              className="flex-1 text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addWebhook}
              className="shrink-0 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>

          <p className="text-[11px] text-gray-400">
            Add multiple Slack webhooks to send alerts to different channels or workspaces. To create a webhook, go to your Slack workspace &gt; Apps &gt; Incoming Webhooks &gt; Add to Slack.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="alertThreshold">Alert Threshold</Label>
          <Input
            id="alertThreshold"
            name="alertThreshold"
            aria-describedby="threshold-help"
            type="number"
            min={1}
            defaultValue={initialThreshold}
            placeholder="1"
          />
          <p id="threshold-help" className="text-[11px] text-gray-400">
            The minimum number of competitors that must be detected before an alert is sent. Set to 1 to be notified about every competitor, or increase to reduce noise if you only care about multiple competitors bidding simultaneously.
          </p>
        </div>

        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="emailAlertsEnabled"
              name="emailAlertsEnabled"
              defaultChecked={parsedConfig.emailAlertsEnabled ?? false}
              className="h-4 w-4 rounded border-gray-300 mt-0.5"
            />
            <div>
              <Label htmlFor="emailAlertsEnabled">Email alerts</Label>
              <p id="email-alerts-help" className="text-[11px] text-gray-400">
                Receive an email when a new competitor is detected bidding on your brand keyword. You'll only be emailed once per new competitor, not on every check.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="alertEmail">Alert email address</Label>
            <div className="flex gap-2">
              <Input
                ref={emailInputRef}
                id="alertEmail"
                name="alertEmail"
                type="email"
                aria-describedby="alert-email-help"
                defaultValue={parsedConfig.alertEmail || ''}
                placeholder="you@company.com"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={testEmail}
                disabled={emailTesting}
                className="shrink-0 text-xs"
              >
                {emailTesting ? 'Sending...' : 'Test'}
              </Button>
            </div>
            <p id="alert-email-help" className="text-[11px] text-gray-400">
              Leave blank to use your account email. Only used for competitor alerts — not marketing.
            </p>
          </div>
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
