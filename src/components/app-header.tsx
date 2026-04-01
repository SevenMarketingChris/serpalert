import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

interface AppHeaderProps {
  /** Optional max-width class (defaults to max-w-5xl) */
  maxWidth?: string
  /** Optional back link */
  backHref?: string
  backLabel?: string
  /** Optional badge next to logo */
  badge?: React.ReactNode
  /** Right side content (user button, links, etc.) */
  children?: React.ReactNode
  /** Whether to show theme toggle (defaults to true) */
  showThemeToggle?: boolean
}

export function AppHeader({
  maxWidth = 'max-w-5xl',
  backHref,
  backLabel = 'Back',
  badge,
  children,
  showThemeToggle = true,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-lg px-6 py-3">
      <div className={`mx-auto ${maxWidth} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          {backHref && (
            <>
              <Link
                href={backHref}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                &larr; {backLabel}
              </Link>
              <span className="text-border">|</span>
            </>
          )}
          <Link href="/" className="text-gradient-tech font-extrabold text-xl tracking-tight">
            SerpAlert
          </Link>
          {badge}
        </div>
        <div className="flex items-center gap-3">
          {children}
          {showThemeToggle && <ThemeToggle />}
        </div>
      </div>
    </header>
  )
}
