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
import { SettingsTabs } from './settings-tabs'

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

      <h1 className="text-lg font-semibold text-gray-900">Settings</h1>

      <SettingsTabs isAdmin={isAdmin} children={{
        brand: (
          <div className="space-y-6">
            <BrandDetailsForm
              brandId={brand.id}
              name={brand.name}
              domain={brand.domain ?? ''}
              keywords={brand.keywords}
              keywordLimit={limits.keywords}
            />
            <KeywordSuggestions brandName={brand.name} currentKeywords={brand.keywords} />
          </div>
        ),
        notifications: (
          <AlertConfigForm
            brandId={brand.id}
            slackWebhookUrl={brand.slackWebhookUrl ?? ''}
            alertConfig={brand.alertConfig ? JSON.stringify(brand.alertConfig) : null}
          />
        ),
        billing: (
          <div className="space-y-6">
            <BillingSection
              brandId={brand.id}
              subscriptionStatus={brand.subscriptionStatus ?? 'trialing'}
              trialEndsAt={brand.trialEndsAt ? new Date(brand.trialEndsAt).toISOString() : null}
              agencyManaged={brand.agencyManaged ?? false}
              hasStripeCustomer={!!brand.stripeCustomerId}
            />
            <ClientPortalSection clientToken={brand.clientToken} />
          </div>
        ),
        integrations: (
          <GoogleAdsForm
            brandId={brand.id}
            googleAdsCustomerId={brand.googleAdsCustomerId ?? ''}
            brandCampaignId={brand.brandCampaignId ?? ''}
          />
        ),
        ...(isAdmin ? {
          admin: (
            <div className="space-y-6">
              <AdminSettingsForm
                brandId={brand.id}
                monthlyBrandSpend={brand.monthlyBrandSpend ?? ''}
                brandRoas={brand.brandRoas ?? ''}
                watchlistDomains={(brand.watchlistDomains ?? []).join(', ')}
                active={brand.active}
                invitedEmail={brand.invitedEmail ?? ''}
              />
              <div className="pt-4 border-t border-gray-200/50">
                <DeleteBrandLink brandId={brand.id} brandName={brand.name} />
              </div>
            </div>
          ),
        } : {}),
      }} />
    </div>
  )
}
