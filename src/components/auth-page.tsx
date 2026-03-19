import { signIn } from '../../auth'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: 'Could not start Google sign-in. Check server configuration.',
  OAuthCallback: 'Google sign-in failed. Please try again.',
  OAuthAccountNotLinked: 'This email is already linked to another account.',
  AccessDenied: 'Access denied. Your email may not be on the allowed list.',
  Default: 'Something went wrong. Please try again.',
}

export function AuthPage({
  subtitle,
  buttonLabel,
  footer,
  error,
}: {
  subtitle: string
  buttonLabel: string
  footer?: React.ReactNode
  error?: string
}) {
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default) : null

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border border-t-2 border-t-primary bg-card shadow-sm p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-gradient-tech">SERP ALERT</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          {errorMessage && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: '/dashboard' })
            }}
          >
            <Button type="submit" className="w-full font-semibold tracking-wide">
              {buttonLabel}
            </Button>
          </form>
          {footer && (
            <div>{footer}</div>
          )}
        </div>
      </div>
    </div>
  )
}
