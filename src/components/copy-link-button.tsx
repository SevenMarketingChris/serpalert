'use client'

import { useState } from 'react'

export function CopyLinkButton({ checkId, brandToken }: { checkId: string; brandToken: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const url = `${window.location.origin}/evidence/${checkId}?token=${brandToken}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="text-center">
      <button className="action-btn" onClick={handleCopy}>
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  )
}
