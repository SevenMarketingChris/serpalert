'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Search, Plus } from 'lucide-react'

interface BrandSwitcherProps {
  currentBrandId: string
  currentBrandName: string
  brands: { id: string; name: string }[]
}

export function BrandSwitcher({ currentBrandId, currentBrandName, brands }: BrandSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus()
    }
  }, [open])

  const filtered = useMemo(() => {
    if (!query.trim()) return brands
    const q = query.toLowerCase()
    return brands.filter(b => b.name.toLowerCase().includes(q))
  }, [brands, query])

  function selectBrand(brandId: string) {
    router.push(`/dashboard/${brandId}`)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
      >
        <span className="truncate">{currentBrandName}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          {/* Search input */}
          {brands.length > 1 && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search brands..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                />
              </div>
            </div>
          )}

          {/* Brand list */}
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-400">No brands found</p>
            ) : (
              filtered.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => selectBrand(brand.id)}
                  className={`flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
                    brand.id === currentBrandId
                      ? 'text-indigo-600 font-medium bg-indigo-50/50'
                      : 'text-gray-700'
                  }`}
                >
                  <span className="truncate">{brand.name}</span>
                </button>
              ))
            )}
          </div>

          {/* Add brand */}
          <div className="border-t border-gray-100 p-1">
            <button
              onClick={() => {
                router.push('/dashboard/new')
                setOpen(false)
                setQuery('')
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Brand</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
