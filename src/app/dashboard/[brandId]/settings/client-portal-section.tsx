'use client'

import { useState } from 'react'
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
      setTimeout(() => setCopiedToken(false), 2000)
    })
  }

  function copyLink() {
    const link = `${window.location.origin}/client/${clientToken}`
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 font-mono">
        Client Portal
      </h3>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Client Token</label>
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
