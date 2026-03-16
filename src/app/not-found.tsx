export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FF6B35]/10 mb-6">
          <svg className="w-6 h-6 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-[32px] font-black text-[var(--c-text)] tracking-tight leading-none mb-2">404</h1>
        <p className="text-[15px] font-semibold text-[var(--c-text)] mb-1">Page not found</p>
        <p className="text-[13px] text-[var(--c-text-muted)] mb-8">
          This page doesn&apos;t exist or you may not have access to it.
        </p>
        <a
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-[#FF6B35] hover:bg-[#E55A25] transition-colors"
        >
          Go to dashboard
        </a>
      </div>
    </div>
  )
}
