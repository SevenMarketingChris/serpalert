'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function NewBrandForm({ adminSecret }: { adminSecret: string }) {
  const [name, setName] = useState('')
  const [keywords, setKeywords] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [slack, setSlack] = useState('')
  const [result, setResult] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminSecret}` },
      body: JSON.stringify({ name, keywords: keywords.split('\n').map(k => k.trim()).filter(Boolean), googleAdsCustomerId: customerId || undefined, slackWebhookUrl: slack || undefined }),
    })
    const brand = await res.json()
    setResult(`Created! Client URL: /client/${brand.clientToken}`)
  }

  return (
    <Card className="max-w-lg">
      <CardHeader><CardTitle>Add Brand</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-sm font-medium block mb-1">Brand Name</label><input className="w-full border rounded px-3 py-2 text-sm" value={name} onChange={e => setName(e.target.value)} required /></div>
          <div><label className="text-sm font-medium block mb-1">Keywords (one per line)</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={4} value={keywords} onChange={e => setKeywords(e.target.value)} placeholder={"Acme Corp\nAcme Corp reviews"} /></div>
          <div><label className="text-sm font-medium block mb-1">Google Ads Customer ID (optional)</label><input className="w-full border rounded px-3 py-2 text-sm" value={customerId} onChange={e => setCustomerId(e.target.value)} placeholder="123-456-7890" /></div>
          <div><label className="text-sm font-medium block mb-1">Slack Webhook (optional)</label><input className="w-full border rounded px-3 py-2 text-sm" value={slack} onChange={e => setSlack(e.target.value)} /></div>
          <Button type="submit">Create Brand</Button>
          {result && <p className="text-sm text-green-600">{result}</p>}
        </form>
      </CardContent>
    </Card>
  )
}
