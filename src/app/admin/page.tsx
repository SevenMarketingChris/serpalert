import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAllActiveBrands } from '@/lib/db/queries'
import { auth } from '../../../auth'
import { isAdminEmail } from '@/lib/auth'
import { NewBrandForm } from './new-brand-form'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'

export default async function AdminPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (!isAdminEmail(session.user?.email)) redirect('/unauthorized')
  const brands = await getAllActiveBrands()

  return (
    <div className="min-h-screen bg-background dark:bg-dot-pattern">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tight text-gradient-neon">Brand Monitor</h1>
            <Badge className="font-mono text-xs tracking-widest">ADMIN</Badge>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-4xl space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="neon-bar-pink card-neon-hover">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-1">Total Brands</p>
              <p className="text-3xl font-black text-gradient-neon">{brands.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Brands table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground font-mono">Brands</h2>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {brands.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No brands yet. Add one below.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {brands.map(b => (
                    <div
                      key={b.id}
                      className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm hover:bg-muted/30 transition-colors"
                    >
                      {/* Active indicator + name */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="inline-block h-2 w-2 rounded-full bg-primary shrink-0 neon-glow" />
                        <span className="font-semibold truncate">{b.name}</span>
                        {b.domain && (
                          <span className="font-mono text-xs text-muted-foreground hidden sm:inline">
                            {b.domain}
                          </span>
                        )}
                      </div>

                      {/* Keywords */}
                      {b.keywords && b.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {b.keywords.slice(0, 3).map((kw: string) => (
                            <span
                              key={kw}
                              className="inline-flex items-center rounded-full border border-border px-2 py-0.5 font-mono text-xs text-neon-cyan border-neon-cyan/30"
                            >
                              {kw}
                            </span>
                          ))}
                          {b.keywords.length > 3 && (
                            <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground">
                              +{b.keywords.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Token */}
                      <span className="font-mono text-xs text-muted-foreground hidden md:inline">
                        {b.clientToken.slice(0, 8)}&hellip;
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Link href={`/dashboard/${b.id}`} className="inline-flex h-7 items-center justify-center rounded-lg px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground transition-colors">Dashboard</Link>
                        <Link href={`/client/${b.clientToken}`} className="inline-flex h-7 items-center justify-center rounded-lg px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground transition-colors">Client View</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* New brand form */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground font-mono">New Brand</h2>
          <NewBrandForm />
        </div>
      </div>
    </div>
  )
}
