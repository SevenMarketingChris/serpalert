import { Shield, Pause } from 'lucide-react'

interface GoogleAdsStatusProps {
  googleAdsCustomerId: string | null
  brandCampaignId: string | null
  hasCompetitors: boolean
}

export function GoogleAdsStatus({ googleAdsCustomerId, brandCampaignId, hasCompetitors }: GoogleAdsStatusProps) {
  if (!googleAdsCustomerId || !brandCampaignId) return null

  const isDefending = hasCompetitors

  return (
    <div className={`rounded-lg p-4 flex items-center gap-3 ${
      isDefending
        ? 'bg-amber-500/10 border border-amber-500/30'
        : 'bg-emerald-500/10 border border-emerald-500/30'
    }`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
        isDefending ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'
      }`}>
        {isDefending ? <Shield className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
      </div>
      <div>
        <p className={`text-sm font-semibold ${isDefending ? 'text-amber-600' : 'text-emerald-600'}`}>
          {isDefending ? 'Brand Campaign Active — Defending' : 'Brand Campaign Paused — Budget Redirected'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isDefending
            ? 'Competitors detected — your brand campaign was automatically enabled to protect your keywords.'
            : 'No competitors detected — your brand budget is being redirected to acquisition campaigns.'}
        </p>
      </div>
    </div>
  )
}
