'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createAgencyBrand, type AgencyBrandState } from './actions'

export function AgencyNewBrandForm({ agencyId }: { agencyId: string }) {
  const [state, formAction, isPending] = useActionState<AgencyBrandState, FormData>(createAgencyBrand, null)

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg shadow-gray-200/20">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="agencyId" value={agencyId} />

        <div className="space-y-1.5">
          <Label htmlFor="name">Brand Name *</Label>
          <Input id="name" name="name" required placeholder="Client's brand name" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="domain">Domain</Label>
          <Input id="domain" name="domain" placeholder="clientbrand.com" />
          <p className="text-[11px] text-gray-400">Their website — excludes their own ads from results.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="keyword">Brand Keyword</Label>
          <Input id="keyword" name="keyword" placeholder="e.g. Client Brand Name" />
          <p className="text-[11px] text-gray-400">The search term to monitor for competitor ads.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="clientEmail">Client Email</Label>
          <Input id="clientEmail" name="clientEmail" type="email" placeholder="client@company.com" />
          <p className="text-[11px] text-gray-400">They&apos;ll get an invite to view their dashboard. Leave blank to manage it yourself.</p>
        </div>

        <Button type="submit" disabled={isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
          {isPending ? 'Adding...' : 'Add Client Brand'}
        </Button>

        {state?.error && !isPending && (
          <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert>
        )}
        {state?.success && !isPending && (
          <Alert><AlertDescription>{state.success}</AlertDescription></Alert>
        )}
      </form>
    </div>
  )
}
