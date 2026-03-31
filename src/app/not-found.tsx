import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-6 px-4">
        <div>
          <span className="text-gradient-tech font-extrabold text-xl">
            SerpAlert
          </span>
        </div>
        <p className="text-8xl font-bold text-indigo-100 font-mono">404</p>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
          <p className="text-gray-500 max-w-sm mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
