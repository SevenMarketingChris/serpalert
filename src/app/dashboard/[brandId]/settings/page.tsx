import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getBrandById, PLAN_LIMITS } from '@/lib/db/queries'
import { DashboardTabs } from '@/components/dashboard-tabs'
import { BrandDetailsForm } from './brand-details-form'
import { AdminSettingsForm } from './admin-settings-form'
import { ClientPortalSection } from './client-portal-section'
import { DangerZone } from './danger-zone'
import { KeywordSuggestions } from '@/components/keyword-suggestions'

export default async function SettingsPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params

  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/sign-in')
  const role = (sessionClaims?.publicMetadata as { role?: string })?.role
  const isAdmin = role === 'admin'

  const brand = await getBrandById(brandId)
  if (!brand || brand.userId !== userId) notFound()
  const plan = brand.plan ?? 'free'
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free

  return (
    <div className="max-w-5xl space-y-4">
      <DashboardTabs brandId={brandId} hasGoogleAds={!!brand.googleAdsCustomerId} />

      <div className="max-w-2xl space-y-6">
        {/* Section 1: Brand Details */}
        <BrandDetailsForm
          brandId={brand.id}
          name={brand.name}
          domain={brand.domain ?? ''}
          keywords={brand.keywords}
          keywordLimit={limits.keywords}
        />

        <KeywordSuggestions brandName={brand.name} currentKeywords={brand.keywords} />

        {/* Section 2: Admin Settings */}
        {isAdmin && (
          <AdminSettingsForm
            brandId={brand.id}
            monthlyBrandSpend={brand.monthlyBrandSpend ?? ''}
            brandRoas={brand.brandRoas ?? ''}
            googleAdsCustomerId={brand.googleAdsCustomerId ?? ''}
            brandCampaignId={brand.brandCampaignId ?? ''}
            slackWebhookUrl={brand.slackWebhookUrl ?? ''}
            watchlistDomains={(brand.watchlistDomains ?? []).join(', ')}
            active={brand.active}
          />
        )}

        {/* Section 3: Client Portal */}
        <ClientPortalSection
          clientToken={brand.clientToken}
        />

        {/* Section 4: Danger Zone */}
        <DangerZone brandId={brand.id} brandName={brand.name} />
      </div>
    </div>
  )
}
