import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getBrandById, PLAN_LIMITS } from '@/lib/db/queries'
import { checkIsAdmin } from '@/lib/auth'
import { BrandDetailsForm } from './brand-details-form'
import { AdminSettingsForm } from './admin-settings-form'
import { ClientPortalSection } from './client-portal-section'
import { AlertConfigForm } from './alert-config-form'
import { GoogleAdsForm } from './google-ads-form'
import { DeleteBrandLink } from './delete-brand-link'
import { KeywordSuggestions } from '@/components/keyword-suggestions'

export default async function SettingsPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params

  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const isAdmin = await checkIsAdmin()

  const brand = await getBrandById(brandId)
  if (!brand) notFound()
  if (brand.agencyManaged && !isAdmin) notFound()
  if (!brand.agencyManaged && brand.userId !== userId) notFound()
  const plan = brand.plan ?? 'free'
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free

  return (
    <div className="max-w-5xl space-y-4">
      <div className="max-w-2xl space-y-6">
        {/* 1. Brand Details */}
        <BrandDetailsForm
          brandId={brand.id}
          name={brand.name}
          domain={brand.domain ?? ''}
          keywords={brand.keywords}
          keywordLimit={limits.keywords}
        />

        {/* 2. Keyword Suggestions */}
        <KeywordSuggestions brandName={brand.name} currentKeywords={brand.keywords} />

        {/* 3. Alert Configuration */}
        <AlertConfigForm
          brandId={brand.id}
          slackWebhookUrl={brand.slackWebhookUrl ?? ''}
        />

        {/* 4. Google Ads */}
        <GoogleAdsForm
          brandId={brand.id}
          googleAdsCustomerId={brand.googleAdsCustomerId ?? ''}
          brandCampaignId={brand.brandCampaignId ?? ''}
        />

        {/* 5. Client Portal */}
        <ClientPortalSection clientToken={brand.clientToken} />

        {/* 6. Admin Settings (admin only) */}
        {isAdmin && (
          <AdminSettingsForm
            brandId={brand.id}
            monthlyBrandSpend={brand.monthlyBrandSpend ?? ''}
            brandRoas={brand.brandRoas ?? ''}
            watchlistDomains={(brand.watchlistDomains ?? []).join(', ')}
            active={brand.active}
          />
        )}

        {/* 7. Delete Brand */}
        <div className="pt-2">
          <DeleteBrandLink brandId={brand.id} brandName={brand.name} />
        </div>
      </div>
    </div>
  )
}
