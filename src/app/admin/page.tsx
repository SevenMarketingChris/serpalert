import { getAllBrands, getCrossClientCompetitors } from '@/lib/db/queries'
import { NewBrandForm } from './new-brand-form'
import { SignOutButton } from './sign-out-button'
import { PauseButton } from '@/components/pause-button'
import { getLogoUrl } from '@/lib/logo'
import { ThemeToggle } from '@/components/theme-toggle'

export default async function AdminPage() {
  const brands = await getAllBrands()
  const active = brands.filter(b => b.active).length
  const crossClientCompetitors = await getCrossClientCompetitors()

  return (
    <div className="min-h-screen bg-[var(--c-bg)]">
      <header className="border-b border-[var(--c-border)] bg-[var(--c-bg)]/90 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-5 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[#FF6B35]">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-semibold text-[var(--c-text)] text-[14px]">Serp Alert</span>
            <span className="text-[var(--c-border)]">/</span>
            <span className="text-[13px] text-[var(--c-text-muted)]">Clients</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-[var(--c-text-faint)]">{active} active</span>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8">
        <div className="mb-6">
          <h1 className="text-[20px] font-semibold text-[var(--c-text)] tracking-tight">Your Clients</h1>
          <p className="text-[var(--c-text-muted)] text-[13px] mt-1">
            Google Ads is scanned 3× daily per client. You&apos;re alerted the moment a competitor starts bidding on their brand.
          </p>
        </div>

        {/* Brands list */}
        <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-xl overflow-hidden mb-6">
          {brands.map((b, i) => {
            const logoUrl = getLogoUrl(b.websiteUrl)
            let hostname: string | null = null
            if (b.websiteUrl) {
              try { hostname = new URL(b.websiteUrl).hostname.replace(/^www\./, '') } catch {}
            }
            return (
              <div
                key={b.id}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--c-card-secondary)] transition-colors ${
                  i < brands.length - 1 ? 'border-b border-[var(--c-border)]' : ''
                }`}
              >
                {/* Logo */}
                <div className="w-8 h-8 rounded-lg bg-[var(--c-card-secondary)] flex items-center justify-center shrink-0 overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt={b.name} className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <span className="text-[#FF6B35] text-[12px] font-bold">{b.name[0]?.toUpperCase()}</span>
                  )}
                </div>

                {/* Name + URL */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-medium text-[var(--c-text)] text-[14px] shrink-0">{b.name}</span>
                  {hostname && (
                    <>
                      <span className="text-[var(--c-border)] shrink-0">·</span>
                      <span className="text-[13px] text-[var(--c-text-muted)] truncate">{hostname}</span>
                    </>
                  )}
                  {b.keywords.length > 0 && (
                    <>
                      <span className="text-[var(--c-border)] shrink-0">·</span>
                      <span className="text-[12px] text-[var(--c-text-faint)] truncate hidden sm:block">
                        {b.keywords.slice(0, 2).join(', ')}{b.keywords.length > 2 ? ` +${b.keywords.length - 2}` : ''}
                      </span>
                    </>
                  )}
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-4 shrink-0">
                  <PauseButton brandId={b.id} initialActive={b.active} />
                  <a
                    href={`/client/${b.clientToken}`}
                    className="text-[12px] text-[var(--c-text-muted)] hover:text-[#FF6B35] transition-colors"
                    target="_blank" rel="noreferrer"
                  >
                    Client report ↗
                  </a>
                  <a
                    href={`/dashboard/${b.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--c-card-secondary)] hover:bg-[var(--c-border)] text-[var(--c-text-secondary)] hover:text-[var(--c-text)] text-[12px] font-medium rounded-lg transition-colors border border-[var(--c-border)]"
                  >
                    Dashboard →
                  </a>
                </div>
              </div>
            )
          })}
          {brands.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-10 h-10 rounded-xl bg-[var(--c-card-secondary)] flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-[var(--c-text-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </div>
              <p className="text-[var(--c-text-secondary)] font-medium text-[14px]">No clients added yet</p>
              <p className="text-[var(--c-text-muted)] text-[12px] mt-1">Add a client below — scans start automatically</p>
            </div>
          )}
        </div>

        {/* Cross-client competitor intelligence */}
        {crossClientCompetitors.length > 0 && (
          <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-xl overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-[var(--c-border)]">
              <h2 className="text-[13px] font-semibold text-[var(--c-text)]">Cross-Client Intelligence</h2>
              <p className="text-[11px] text-[var(--c-text-muted)] mt-0.5">Competitors bidding on multiple client brands — the most aggressive in your portfolio</p>
            </div>
            <div className="divide-y divide-[var(--c-border)]">
              {crossClientCompetitors.slice(0, 10).map(comp => (
                <div key={comp.domain} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-7 h-7 rounded-md bg-[var(--c-card-secondary)] border border-[var(--c-border)] flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${comp.domain}&sz=32`}
                      alt=""
                      className="w-4 h-4 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[var(--c-text)] font-medium">{comp.domain}</p>
                    <p className="text-[11px] text-[var(--c-text-muted)] truncate">
                      Targeting: {comp.brandNames.join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-[13px] font-semibold text-[#E54D42] tabular-nums">{comp.brandNames.length}</p>
                      <p className="text-[10px] text-[var(--c-text-muted)]">clients</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[12px] text-[var(--c-text)] tabular-nums">{comp.totalAppearances}</p>
                      <p className="text-[10px] text-[var(--c-text-muted)]">appearances</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[12px] text-[var(--c-text-muted)] tabular-nums">
                        {new Date(comp.lastSeen).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-[10px] text-[var(--c-text-muted)]">last seen</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add brand */}
        <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-xl p-6">
          <div className="mb-5">
            <h2 className="text-[15px] font-semibold text-[var(--c-text)]">Add New Client</h2>
            <p className="text-[12px] text-[var(--c-text-muted)] mt-0.5">Enter the brand name, website, and the search terms you want monitored.</p>
          </div>
          <NewBrandForm />
        </div>
      </main>
    </div>
  )
}
