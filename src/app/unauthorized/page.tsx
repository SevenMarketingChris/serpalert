import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="text-center space-y-4 max-w-md">
        <p className="text-xs uppercase tracking-widest text-tech-blue font-mono">401</p>
        <h1 className="text-3xl font-black text-gradient-tech">Access Denied</h1>
        <p className="text-muted-foreground">You don&apos;t have permission to view this page.</p>
        <Link href="/dashboard" className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted transition-colors dark:border-input dark:bg-input/30 dark:hover:bg-input/50">Go to Dashboard</Link>
      </div>
    </div>
  )
}
