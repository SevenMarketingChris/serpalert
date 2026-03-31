import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center space-y-4 max-w-md">
        <p className="text-xs uppercase tracking-widest text-indigo-600 font-mono">401</p>
        <h1 className="text-3xl font-black text-indigo-600">Access Denied</h1>
        <p className="text-gray-500">You don&apos;t have permission to view this page.</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/dashboard" className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">Go to Dashboard</Link>
          <Link href="/sign-in" className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Sign In</Link>
        </div>
      </div>
    </div>
  )
}
