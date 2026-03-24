'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { deleteBrandAction } from './actions'

interface Props {
  brandId: string
  brandName: string
}

export function DangerZone({ brandId, brandName }: Props) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deleteBrandAction(brandId)
    setDeleting(false)
  }

  return (
    <div className="border border-destructive/50 rounded-lg p-6">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-destructive font-mono mb-4">
        Danger Zone
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Permanently delete this brand and all associated data. This action cannot be undone.
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete Brand
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{brandName}&rdquo;?</DialogTitle>
            <DialogDescription>
              This will permanently delete this brand and all its data including checks, competitor ads, and auction insights. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Yes, Delete Brand'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
