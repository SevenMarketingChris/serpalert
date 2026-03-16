'use client'
import { useState } from 'react'

type Props = {
  brandId: string
  initialAgencyName: string | null
  initialAgencyLogoUrl: string | null
  initialAgencyPrimaryColor: string | null
  initialReportEmail: string | null
}

export function BrandSettings({ brandId, initialAgencyName, initialAgencyLogoUrl, initialAgencyPrimaryColor, initialReportEmail }: Props) {
  const [agencyName, setAgencyName] = useState(initialAgencyName ?? '')
  const [agencyLogoUrl, setAgencyLogoUrl] = useState(initialAgencyLogoUrl ?? '')
  const [agencyPrimaryColor, setAgencyPrimaryColor] = useState(initialAgencyPrimaryColor ?? '#FF6B35')
  const [reportEmail, setReportEmail] = useState(initialReportEmail ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    await fetch(`/api/brands/${brandId}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agencyName: agencyName.trim() || null,
        agencyLogoUrl: agencyLogoUrl.trim() || null,
        agencyPrimaryColor: agencyPrimaryColor || null,
        reportEmail: reportEmail.trim() || null,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-[var(--c-text-muted)] uppercase tracking-wider mb-1.5">Agency name</label>
          <input
            type="text"
            value={agencyName}
            onChange={e => setAgencyName(e.target.value)}
            placeholder="Seven Marketing"
            className="w-full bg-[var(--c-card-secondary)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[13px] text-[var(--c-text)] placeholder-[var(--c-text-faint)] focus:outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[var(--c-text-muted)] uppercase tracking-wider mb-1.5">Brand accent colour</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={agencyPrimaryColor}
              onChange={e => setAgencyPrimaryColor(e.target.value)}
              className="w-9 h-9 rounded-lg border border-[var(--c-border)] bg-[var(--c-card-secondary)] cursor-pointer p-0.5"
            />
            <input
              type="text"
              value={agencyPrimaryColor}
              onChange={e => setAgencyPrimaryColor(e.target.value)}
              placeholder="#FF6B35"
              className="flex-1 bg-[var(--c-card-secondary)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[13px] text-[var(--c-text)] placeholder-[var(--c-text-faint)] focus:outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/20 transition-all font-mono"
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-medium text-[var(--c-text-muted)] uppercase tracking-wider mb-1.5">Agency logo URL</label>
        <input
          type="url"
          value={agencyLogoUrl}
          onChange={e => setAgencyLogoUrl(e.target.value)}
          placeholder="https://youragency.com/logo.png"
          className="w-full bg-[var(--c-card-secondary)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[13px] text-[var(--c-text)] placeholder-[var(--c-text-faint)] focus:outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/20 transition-all"
        />
        <p className="text-[11px] text-[var(--c-text-muted)] mt-1">Shown in the client portal header and email reports instead of the SerpAlert logo</p>
      </div>
      <div>
        <label className="block text-[11px] font-medium text-[var(--c-text-muted)] uppercase tracking-wider mb-1.5">Monthly report email</label>
        <input
          type="email"
          value={reportEmail}
          onChange={e => setReportEmail(e.target.value)}
          placeholder="client@example.com"
          className="w-full bg-[var(--c-card-secondary)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[13px] text-[var(--c-text)] placeholder-[var(--c-text-faint)] focus:outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/20 transition-all"
        />
        <p className="text-[11px] text-[var(--c-text-muted)] mt-1">Sent on the 1st of each month with last month&apos;s summary</p>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20 hover:bg-[#FF6B35]/20 text-[13px] font-medium rounded-lg transition-colors disabled:opacity-40"
      >
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save settings'}
      </button>
    </div>
  )
}
