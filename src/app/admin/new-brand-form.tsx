'use client'
import { useState } from 'react'

const inputClass = "w-full bg-[#141414] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[14px] text-[var(--c-text)] placeholder-[var(--c-text-faint)] focus:outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/20 transition-all"
const labelClass = "block text-[11px] font-medium text-[var(--c-text-muted)] uppercase tracking-wider mb-1.5"

export function NewBrandForm() {
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [keywords, setKeywords] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [slack, setSlack] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        websiteUrl: website || undefined,
        keywords: keywords.split('\n').map(k => k.trim()).filter(Boolean),
        googleAdsCustomerId: customerId || undefined,
        slackWebhookUrl: slack || undefined,
      }),
    })
    const brand = await res.json()
    setResult(`Created — client URL: /client/${brand.clientToken}`)
    setName(''); setWebsite(''); setKeywords(''); setCustomerId(''); setSlack('')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Brand Name</label>
          <input className={inputClass} value={name} onChange={e => setName(e.target.value)} required placeholder="Acme Corp" />
        </div>
        <div>
          <label className={labelClass}>Website URL</label>
          <input className={inputClass} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://acme.com" type="url" />
        </div>
      </div>
      <div>
        <label className={labelClass}>
          Brand Variants <span className="text-[var(--c-text-faint)] normal-case tracking-normal font-normal">— one per line</span>
        </label>
        <textarea className={inputClass} rows={4} value={keywords} onChange={e => setKeywords(e.target.value)} placeholder={"Acme Corp\nAcme Corp reviews\nbuy Acme"} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Google Ads Customer ID <span className="text-[var(--c-text-faint)] normal-case tracking-normal font-normal">(optional)</span></label>
          <input className={inputClass} value={customerId} onChange={e => setCustomerId(e.target.value)} placeholder="123-456-7890" />
        </div>
        <div>
          <label className={labelClass}>Slack Webhook <span className="text-[var(--c-text-faint)] normal-case tracking-normal font-normal">(optional)</span></label>
          <input className={inputClass} value={slack} onChange={e => setSlack(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-[#FF6B35] text-white text-[13px] font-semibold rounded-lg hover:bg-[#E55A25] transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Add Client'}
        </button>
        {result && <p className="text-[12px] text-[#59D499]">{result}</p>}
      </div>
    </form>
  )
}
