'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Brand } from '@/lib/db/schema'

function anonymize(text: string): string {
  if (text.length <= 2) return '••'
  return text[0] + '•'.repeat(Math.min(text.length - 2, 8)) + text[text.length - 1]
}

function anonymizeDomain(domain: string): string {
  const parts = domain.split('.')
  if (parts.length < 2) return anonymize(domain)
  return anonymize(parts[0]) + '.' + parts.slice(1).join('.')
}

export function DashboardBrandsList({ brands }: { brands: Brand[] }) {
  const [anon, setAnon] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground font-mono">
          Your Brands
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAnon(a => !a)}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-3 text-xs font-mono hover:bg-muted transition-colors"
          >
            {anon ? 'Show real data' : 'Anonymise'}
          </button>
          <Link
            href="/dashboard/new"
            className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            + Add brand
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {brands.map(b => (
              <div
                key={b.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="status-dot-active" />
                  <span className="font-semibold truncate">
                    {anon ? anonymize(b.name) : b.name}
                  </span>
                  {b.domain && (
                    <span className="font-mono text-xs text-muted-foreground hidden sm:inline">
                      {anon ? anonymizeDomain(b.domain) : b.domain}
                    </span>
                  )}
                </div>
                <Badge className="font-mono text-xs tracking-widest uppercase shrink-0">
                  {b.plan}
                </Badge>
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/dashboard/${b.id}`}
                    className="inline-flex h-7 items-center justify-center rounded-lg px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href={`/client/${b.clientToken}`}
                    className="inline-flex h-7 items-center justify-center rounded-lg px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground transition-colors"
                  >
                    Client View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
