'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { updateAdminSettings, type SettingsState } from './actions'
import { X, UserPlus } from 'lucide-react'

interface Props {
  brandId: string
  monthlyBrandSpend: string
  brandRoas: string
  watchlistDomains: string
  active: boolean
  invitedEmail: string
}

export function AdminSettingsForm({
  brandId,
  monthlyBrandSpend,
  brandRoas,
  watchlistDomains,
  active,
  invitedEmail,
}: Props) {
  const [state, formAction, isPending] = useActionState<SettingsState, FormData>(
    (prev, formData) => updateAdminSettings(prev, formData, brandId),
    null,
  )

  // Client email list management
  const initialEmails = invitedEmail ? invitedEmail.split(',').map(e => e.trim()).filter(Boolean) : []
  const [emails, setEmails] = useState<string[]>(initialEmails)
  const [newEmail, setNewEmail] = useState('')

  function addEmail() {
    const email = newEmail.trim().toLowerCase()
    if (!email) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Invalid email address'); return }
    if (emails.includes(email)) { toast.error('Email already added'); return }
    setEmails([...emails, email])
    setNewEmail('')
    toast.success(`${email} will be invited when you save`)
  }

  function removeEmail(email: string) {
    setEmails(emails.filter(e => e !== email))
    toast.success(`${email} will be removed when you save`)
  }

  useEffect(() => {
    if (state?.success) toast.success(state.success)
    if (state?.error) toast.error(state.error)
  }, [state])

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

        <div className="space-y-3">
          <Label>Client Access</Label>

          {/* Hidden field sends comma-separated emails to the server action */}
          <input type="hidden" name="invitedEmail" value={emails.join(',')} />

          {/* Current users list */}
          {emails.length > 0 && (
            <div className="space-y-2">
              {emails.map(email => (
                <div key={email} className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <span className="text-sm font-mono text-gray-700 truncate">{email}</span>
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new user */}
          <div className="flex gap-2">
            <Input
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmail() } }}
              type="email"
              placeholder="client@company.com"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEmail}
              className="shrink-0 gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>

          <p className="text-[11px] text-gray-400">
            Each person receives an invite email when you save. They can sign in with Google or email to view this brand&apos;s dashboard. Remove to revoke access.
          </p>
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
