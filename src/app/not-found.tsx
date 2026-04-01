import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-8 px-4">
        <div>
          <Link href="/">
            <span className="text-gradient-tech font-extrabold text-2xl">
              SerpAlert
            </span>
          </Link>
        </div>
        <div className="space-y-4">
          <p className="text-8xl font-bold text-indigo-500/20 font-mono">404</p>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-100">Page not found</h1>
            <p className="text-slate-400 max-w-sm mx-auto">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-6 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/audit"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-6 text-sm font-semibold text-indigo-400 hover:bg-indigo-500/20 transition-colors"
          >
            Run a Free SERP Check
          </Link>
        </div>
      </div>
    </div>
  )
}
