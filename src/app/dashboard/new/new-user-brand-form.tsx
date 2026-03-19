'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createBrand } from './actions'

interface Props {
  keywordLimit: number
}

export function NewUserBrandForm({ keywordLimit }: Props) {
  const [state, formAction, isPending] = useActionState(createBrand, null)

  return (
    <Card className="max-w-lg card-neon-hover">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Add Brand</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Brand Name <span className="text-destructive">*</span></Label>
            <Input id="name" name="name" placeholder="e.g. Acme Corp" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="domain">Domain <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input id="domain" name="domain" placeholder="acmecorp.co.uk" />
            <p className="text-xs text-muted-foreground">Used to exclude your own ads from competitor results</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="keywords">
              Keywords{' '}
              <span className="text-muted-foreground font-normal">
                (optional, comma-separated, up to {keywordLimit})
              </span>
            </Label>
            <Input
              id="keywords"
              name="keywords"
              placeholder="Acme Corp, Acme Corp reviews, buy Acme"
            />
            <p className="text-xs text-muted-foreground">
              Up to {keywordLimit} keywords on the free plan
            </p>
          </div>

          <Button type="submit" disabled={isPending} className="neon-glow w-full">
            {isPending ? 'Creating…' : 'Create Brand'}
          </Button>

          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
