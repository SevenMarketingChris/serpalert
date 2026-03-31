'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { updateBrandDetails, type SettingsState } from './actions'

interface Props {
  brandId: string
  name: string
  domain: string
  keywords: string[]
  keywordLimit: number
}

export function BrandDetailsForm({ brandId, name, domain, keywords, keywordLimit }: Props) {
  const [state, formAction, isPending] = useActionState<SettingsState, FormData>(updateBrandDetails, null)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 font-mono">
        Brand Details
      </h3>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="brandId" value={brandId} />

        <div className="space-y-1.5">
          <Label htmlFor="name">Brand Name <span className="text-destructive">*</span></Label>
          <Input id="name" name="name" defaultValue={name} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="domain">Domain</Label>
          <Input id="domain" name="domain" defaultValue={domain} placeholder="yourbrand.com" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="keywords">
            Keywords{' '}
            <span className="text-muted-foreground font-normal text-xs">
              ({keywords.length}/{keywordLimit} keywords)
            </span>
          </Label>
          <textarea
            id="keywords"
            name="keywords"
            className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue={keywords.join('\n')}
            placeholder="One keyword per line"
          />
          <p className="text-xs text-muted-foreground">One keyword per line</p>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Brand Details'}
        </Button>

        {state?.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state?.success && (
          <Alert>
            <AlertDescription>{state.success}</AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  )
}
