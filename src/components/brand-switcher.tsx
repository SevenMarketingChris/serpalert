'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus } from 'lucide-react'

interface BrandSwitcherProps {
  currentBrandId: string
  currentBrandName: string
  brands: { id: string; name: string }[]
}

export function BrandSwitcher({ currentBrandId, currentBrandName, brands }: BrandSwitcherProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
      >
        <span className="truncate">{currentBrandName}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border bg-popover py-1 shadow-lg">
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => {
                router.push(`/dashboard/${brand.id}`)
                setOpen(false)
              }}
              className={`flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-accent ${
                brand.id === currentBrandId
                  ? 'text-primary font-medium'
                  : 'text-popover-foreground'
              }`}
            >
              <span className="truncate">{brand.name}</span>
            </button>
          ))}
          <div className="my-1 border-t border-border" />
          <button
            onClick={() => {
              router.push('/dashboard/new')
              setOpen(false)
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-accent transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Brand</span>
          </button>
        </div>
      )}
    </div>
  )
}
