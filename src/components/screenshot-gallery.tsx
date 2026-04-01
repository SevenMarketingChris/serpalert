'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Camera } from 'lucide-react'

interface Screenshot {
  id: string
  keyword: string
  checkedAt: Date
  competitorCount: number
  screenshotUrl: string | null
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ScreenshotGallery({ screenshots }: { screenshots: Screenshot[] }) {
  const [selectedKeyword, setSelectedKeyword] = useState('all')
  const [modalImage, setModalImage] = useState<{ url: string; keyword: string } | null>(null)
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  const uniqueKeywords = [...new Set(screenshots.map((s) => s.keyword))].sort()

  const filtered = selectedKeyword === 'all'
    ? screenshots
    : screenshots.filter((s) => s.keyword === selectedKeyword)

  if (screenshots.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-12 text-center space-y-3 shadow-lg shadow-gray-200/20">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 mx-auto">
          <Camera className="h-6 w-6" />
        </div>
        <p className="font-semibold text-gray-900">No screenshots yet</p>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Screenshots are captured automatically during SERP checks. Run a manual check or wait for the next scheduled scan.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Screenshots are captured automatically with every hourly check. Your first screenshots will appear after the next scheduled scan.
        </p>
      </div>
    )
  }

  // Group by date
  const groups = new Map<string, Screenshot[]>()
  for (const s of filtered) {
    const dateKey = new Date(s.checkedAt).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    if (!groups.has(dateKey)) groups.set(dateKey, [])
    groups.get(dateKey)!.push(s)
  }

  return (
    <>
      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={selectedKeyword}
          onChange={(e) => setSelectedKeyword(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Keywords</option>
          {uniqueKeywords.map((kw) => (
            <option key={kw} value={kw}>{kw}</option>
          ))}
        </select>
        <span className="text-sm text-gray-400">
          {filtered.length} screenshot{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Gallery */}
      <div className="space-y-6">
        {[...groups.entries()].map(([date, items]) => (
          <div key={date} className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400">{date}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((check) => {
                if (!check.screenshotUrl) return null
                return (
                <div
                  key={check.id}
                  className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl overflow-hidden shadow-lg shadow-gray-200/20 group"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!check.screenshotUrl) return
                      setModalImage({ url: check.screenshotUrl, keyword: check.keyword })
                      setImageStatus('loading')
                    }}
                    className="block relative aspect-video w-full bg-gray-50 overflow-hidden cursor-pointer"
                  >
                    <Image
                      src={check.screenshotUrl}
                      alt={`SERP screenshot for "${check.keyword}"`}
                      fill
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </button>

                  <div className="p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="bg-indigo-50 text-indigo-600 text-xs font-mono px-2 py-0.5 rounded-md">
                        {check.keyword}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 text-xs ${
                        check.competitorCount > 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                          check.competitorCount > 0 ? 'bg-red-500' : 'bg-emerald-500'
                        }`} />
                        {check.competitorCount > 0
                          ? `${check.competitorCount} competitor${check.competitorCount !== 1 ? 's' : ''}`
                          : 'Clear'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono">
                      {formatDateTime(check.checkedAt)}
                    </p>
                  </div>
                </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={!!modalImage} onOpenChange={(open) => {
        if (!open) { setModalImage(null); setImageStatus('loading') }
      }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          {modalImage && (
            <>
              <p className="text-sm font-medium mb-2 font-mono text-gray-900">
                SERP: <span className="text-indigo-600">{modalImage.keyword}</span>
              </p>
              <div className="rounded-lg overflow-hidden bg-gray-50 relative">
                {imageStatus === 'error' ? (
                  <div className="p-12 text-center text-gray-400 text-sm">Screenshot unavailable</div>
                ) : (
                  <>
                    {imageStatus === 'loading' && (
                      <div className="absolute inset-0 bg-gray-100 animate-pulse" />
                    )}
                    <Image
                      src={modalImage.url}
                      alt={`SERP for ${modalImage.keyword}`}
                      width={1200}
                      height={800}
                      className="w-full h-auto"
                      loading="lazy"
                      unoptimized
                      onError={() => setImageStatus('error')}
                      onLoad={() => setImageStatus('loaded')}
                    />
                  </>
                )}
              </div>
              <a
                href={modalImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:underline mt-1 inline-block"
              >
                Open full size
              </a>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
