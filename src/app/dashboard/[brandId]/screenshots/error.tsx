'use client'

import Link from 'next/link'

export default function ScreenshotsError({ reset }: { reset: () => void }) {
  return (
    <div className="max-w-5xl" role="alert">
      <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-8 text-center space-y-4 shadow-lg shadow-gray-200/20">
        <h2 className="text-lg font-semibold text-gray-900">Failed to load screenshots</h2>
        <p className="text-sm text-gray-500">There was a problem loading SERP screenshots. This is usually temporary.</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            Try Again
          </button>
          <Link href="/dashboard" className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
