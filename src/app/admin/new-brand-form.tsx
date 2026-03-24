'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createBrandAction } from './actions'

export function NewBrandForm() {
  const [state, formAction, isPending] = useActionState(createBrandAction, null)

  return (
    <Card className="max-w-lg card-neon-hover">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Add Brand</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          {/* Required fields */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Brand Name</Label>
            <Input id="name" name="name" placeholder="e.g. Acme Corp" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="keywords">Keywords <span className="text-muted-foreground font-normal">(one per line)</span></Label>
            <textarea
              id="keywords"
              name="keywords"
              rows={4}
              placeholder={"Acme Corp\nAcme Corp reviews"}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 resize-none transition-colors"
            />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-2 text-xs text-muted-foreground font-mono uppercase tracking-widest">Optional</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="domain">Brand Domain</Label>
            <Input id="domain" name="domain" placeholder="acmecorp.co.uk" />
            <p className="text-xs text-muted-foreground">Used to exclude your own ads from competitor results</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="monthlyBrandSpend">Monthly Brand Spend (£)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                <Input
                  id="monthlyBrandSpend"
                  name="monthlyBrandSpend"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-6"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brandRoas">Brand ROAS</Label>
              <div className="relative">
                <Input
                  id="brandRoas"
                  name="brandRoas"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 8.5"
                  className="pr-7"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">x</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customerId">Google Ads Customer ID</Label>
            <Input id="customerId" name="customerId" placeholder="123-456-7890" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slack">Slack Webhook</Label>
            <Input id="slack" name="slack" placeholder="https://hooks.slack.com/…" />
          </div>

          <Button type="submit" disabled={isPending} className="neon-glow-cta w-full">
            {isPending ? 'Creating…' : 'Create Brand'}
          </Button>

          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {state?.clientToken && (
            <Alert className="border-neon-green/30 text-neon-green">
              <AlertDescription className="text-neon-green">
                Brand created! Client URL:{' '}
                <a href={`/client/${state.clientToken}`} className="underline underline-offset-4 font-mono text-xs">
                  /client/{state.clientToken}
                </a>
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
