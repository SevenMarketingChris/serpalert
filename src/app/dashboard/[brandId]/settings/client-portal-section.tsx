'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface Props {
  clientToken: string
}

export function ClientPortalSection({ clientToken }: Props) {
  const [copiedToken, setCopiedToken] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const portalLink = typeof window !== 'undefined'
    ? `${window.location.origin}/client/${clientToken}`
    : `/client/${clientToken}`

  function copyToken() {
    navigator.clipboard.writeText(clientToken).then(() => {
      setCopiedToken(true)
      toast.success('Token copied to clipboard')
      setTimeout(() => setCopiedToken(false), 2000)
    })
  }

  function copyLink() {
    const link = `${window.location.origin}/client/${clientToken}`
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true)
      toast.success('Portal link copied to clipboard')
      setTimeout(() => setCopiedLink(false), 2000)
    })
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg shadow-gray-200/20 space-y-4">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 font-mono">
          Client Portal
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Share a read-only dashboard with your client or team. The portal link gives view-only access to monitoring results, competitor data, and screenshots — no login required. Anyone with the link can view the data, so share it securely.
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Client Token</label>
          <p className="text-[11px] text-gray-400">
            A unique identifier for this brand&apos;s client portal. Keep this private — it grants access to the read-only dashboard.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm truncate">
              {clientToken}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={copyToken}>
              {copiedToken ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Client Portal Link</label>
          <p className="text-[11px] text-gray-400">
            Send this link to your client. They can view their monitoring dashboard, competitor data, and SERP screenshots without needing to sign in.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm truncate">
              {portalLink}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={copyLink}>
              {copiedLink ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
