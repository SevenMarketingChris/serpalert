'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

interface ShareReportButtonProps {
  brandName: string
  portalUrl: string
}

export function ShareReportButton({ brandName, portalUrl }: ShareReportButtonProps) {
  const [copied, setCopied] = useState(false)

  const emailSubject = encodeURIComponent(`${brandName} — Brand Protection Report`)
  const emailBody = encodeURIComponent(
    `Hi,\n\nHere is the latest brand protection report for ${brandName}.\n\nView the live dashboard: ${portalUrl}\n\nThis report updates automatically with hourly monitoring of your brand keywords across Google Ads.\n\nBest regards`
  )
  const mailtoUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`

  async function copyLink() {
    await navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={mailtoUrl}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share via Email
      </a>
      <button
        onClick={copyLink}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  )
}
