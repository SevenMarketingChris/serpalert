export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <div className="h-6 w-28 rounded bg-muted animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="h-4 w-40 rounded bg-muted animate-pulse hidden sm:block" />
            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
      <div className="container mx-auto p-6 max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          <div className="h-8 w-24 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="divide-y divide-border">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
                <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                <div className="h-4 w-24 rounded bg-muted animate-pulse hidden sm:block" />
                <div className="flex-1" />
                <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
                <div className="h-7 w-20 rounded-lg bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
