import { createPageMetadata } from '@/lib/metadata'
import AuditPageClient from './audit-page-client'

export const metadata = createPageMetadata({
  title: 'Free Brand Bidding Audit',
  description:
    'Check whether competitors are bidding on your brand keyword right now. Run a free audit, see live competitor coverage, and get the full report by email.',
  path: '/audit',
  keywords: [
    'brand bidding audit',
    'competitor brand keyword audit',
    'free brand protection audit',
    'google ads brand monitoring',
  ],
})

export default function AuditPage() {
  return <AuditPageClient />
}
