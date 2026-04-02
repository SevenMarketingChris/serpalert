import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getBrandById, PLAN_LIMITS } from '@/lib/db/queries'
import { checkIsAdmin, authorizeBrandAccess, checkIsAgencyAdmin } from '@/lib/auth'
import { BrandDetailsForm } from './brand-details-form'
import { AdminSettingsForm } from './admin-settings-form'
import { ClientPortalSection } from './client-portal-section'
import { AlertConfigForm } from './alert-config-form'
import { GoogleAdsForm } from './google-ads-form'
import { BillingSection } from './billing-section'
import { DeleteBrandLink } from './delete-brand-link'
import { KeywordSuggestions } from '@/components/keyword-suggestions'

export default async function SettingsPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params

  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const isAdmin = await checkIsAdmin()

  const brand = await getBrandById(brandId)
  if (!brand) notFound()
  const { agencyId: userAgencyId } = await checkIsAgencyAdmin()
  try {
    authorizeBrandAccess(brand, userId, isAdmin, userAgencyId)
  } catch {
    notFound()
  }
  const plan = brand.plan ?? 'free'
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free

  return (
    <div className="max-w-5xl space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
        <Link href={`/dashboard/${brand.id}`} className="hover:text-indigo-600 transition-colors">&larr; Overview</Link>
        <span>/</span>
        <span className="text-gray-600">Settings</span>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* 1. Client Access & Admin (admin only — at the top) */}
        {isAdmin && (
          <AdminSettingsForm
            brandId={brand.id}
            monthlyBrandSpend={brand.monthlyBrandSpend ?? ''}
            brandRoas={brand.brandRoas ?? ''}
            watchlistDomains={(brand.watchlistDomains ?? []).join(', ')}
            active={brand.active}
            invitedEmail={brand.invitedEmail ?? ''}
          />
        )}

        {/* 2. Alert Configuration */}
        <AlertConfigForm
          brandId={brand.id}
          slackWebhookUrl={brand.slackWebhookUrl ?? ''}
        />

        {/* 3. Brand Details */}
        <BrandDetailsForm
          brandId={brand.id}
          name={brand.name}
          domain={brand.domain ?? ''}
          keywords={brand.keywords}
          keywordLimit={limits.keywords}
        />

        {/* 4. Billing */}
        <BillingSection
          brandId={brand.id}
          subscriptionStatus={brand.subscriptionStatus ?? 'trialing'}
          trialEndsAt={brand.trialEndsAt ? new Date(brand.trialEndsAt).toISOString() : null}
          agencyManaged={brand.agencyManaged ?? false}
          hasStripeCustomer={!!brand.stripeCustomerId}
        />

        {/* 5. Client Portal */}
        <ClientPortalSection clientToken={brand.clientToken} />

        {/* 6. Google Ads */}
        <GoogleAdsForm
          brandId={brand.id}
          googleAdsCustomerId={brand.googleAdsCustomerId ?? ''}
          brandCampaignId={brand.brandCampaignId ?? ''}
        />

        {/* 7. Keyword Suggestions */}
        <KeywordSuggestions brandName={brand.name} currentKeywords={brand.keywords} />

        {/* 8. Delete Brand */}
        <div className="pt-2">
          <DeleteBrandLink brandId={brand.id} brandName={brand.name} />
        </div>
      </div>
    </div>
  )
}
