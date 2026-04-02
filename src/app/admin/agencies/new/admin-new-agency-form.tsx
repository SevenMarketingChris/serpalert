'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createAgencyAction, type CreateAgencyState } from './actions'

export function AdminNewAgencyForm() {
  const [state, formAction, isPending] = useActionState<CreateAgencyState, FormData>(createAgencyAction, null)

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg shadow-gray-200/20">
      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Agency Name *</Label>
          <Input id="name" name="name" required placeholder="Acme Digital Marketing" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ownerEmail">Owner Email *</Label>
          <Input id="ownerEmail" name="ownerEmail" type="email" required placeholder="owner@agency.com" />
          <p className="text-[11px] text-gray-400">This person will be the agency admin. They sign in with this email.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactName">Contact Name</Label>
          <Input id="contactName" name="contactName" placeholder="John Smith" />
        </div>
        <Button type="submit" disabled={isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
          {isPending ? 'Creating...' : 'Create Agency'}
        </Button>
        {state?.error && <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert>}
        {state?.success && <Alert><AlertDescription>{state.success}</AlertDescription></Alert>}
      </form>
    </div>
  )
}
