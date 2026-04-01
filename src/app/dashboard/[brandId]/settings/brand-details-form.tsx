'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
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
  const [state, formAction, isPending] = useActionState<SettingsState, FormData>(
    (prev, formData) => updateBrandDetails(prev, formData, brandId),
    null,
  )

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg shadow-gray-200/20 space-y-4">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 font-mono">
          Brand Details
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Basic information about the brand you&apos;re monitoring. We use these details to identify competitor ads targeting your brand.
        </p>
      </div>
      <form action={formAction} className="space-y-4">

        <div className="space-y-1.5">
          <Label htmlFor="name">Brand Name <span className="text-destructive">*</span></Label>
          <Input id="name" name="name" defaultValue={name} required />
          <p className="text-[11px] text-gray-400">
            The name of your brand as it appears in Google search results. This is used to identify your brand in SERP checks.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="domain">Domain</Label>
          <Input id="domain" name="domain" defaultValue={domain} placeholder="yourbrand.com" />
          <p className="text-[11px] text-gray-400">
            Your website domain (e.g. yourbrand.com). Used to filter out your own ads from competitor results so you don&apos;t get false alerts.
          </p>
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
            aria-describedby="keywords-help"
            className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue={keywords.join('\n')}
            placeholder="One keyword per line"
          />
          <p id="keywords-help" className="text-[11px] text-gray-400">
            The brand keywords you want to monitor. One per line. These are the search terms we check for competitor ads — typically your brand name and common misspellings. You can use up to {keywordLimit} keywords on your current plan.
          </p>
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
