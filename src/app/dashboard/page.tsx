import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '../../../auth'
import { isAdminEmail } from '@/lib/auth'
import { getBrandsForUser } from '@/lib/db/queries'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (isAdminEmail(session.user?.email)) redirect('/admin')

  const userEmail = session.user?.email ?? ''
  const brands = await getBrandsForUser(userEmail)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tight text-gradient-tech">SerpAlert</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">{userEmail}</span>
            <a
              href="/api/auth/signout"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </a>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-4xl space-y-8">
        {brands.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-gradient-tech">No brands yet</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Add your first brand to start monitoring competitor ads on your branded keywords.
              </p>
            </div>
            <Card className="metric-stripe-blue w-full max-w-sm">
              <CardContent className="p-6 flex flex-col items-center gap-4">
                <p className="text-sm text-center text-muted-foreground">
                  Add your first brand to start monitoring
                </p>
                <Link
                  href="/dashboard/new"
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Add your first brand
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Brands list */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground font-mono">
                Your Brands
              </h2>
              <Link
                href="/dashboard/new"
                className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                + Add brand
              </Link>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {brands.map(b => (
                    <div
                      key={b.id}
                      className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm hover:bg-muted/30 transition-colors"
                    >
                      {/* Active indicator + name + domain */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="status-dot-active" />
                        <span className="font-semibold truncate">{b.name}</span>
                        {b.domain && (
                          <span className="font-mono text-xs text-muted-foreground hidden sm:inline">
                            {b.domain}
                          </span>
                        )}
                      </div>

                      {/* Plan badge */}
                      <Badge className="font-mono text-xs tracking-widest uppercase shrink-0">
                        {b.plan}
                      </Badge>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Link
                          href={`/dashboard/${b.id}`}
                          className="inline-flex h-7 items-center justify-center rounded-lg px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground transition-colors"
                        >
                          Dashboard
                        </Link>
                        <Link
                          href={`/client/${b.clientToken}`}
                          className="inline-flex h-7 items-center justify-center rounded-lg px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground transition-colors"
                        >
                          Client View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
