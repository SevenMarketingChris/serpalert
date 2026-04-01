import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MarketingCta } from '@/components/marketing-cta'
import { MarketingFooter } from '@/components/marketing-footer'
import { MarketingHeader } from '@/components/marketing-header'
import { getAllPosts } from '@/lib/blog'
import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata({
  title: 'Blog',
  description: 'Guides on brand bidding, Google Ads brand protection, competitor ad monitoring, and saving wasted brand campaign spend.',
  path: '/blog',
  keywords: [
    'brand bidding blog',
    'google ads brand protection guides',
    'competitor brand monitoring articles',
  ],
})

const categoryLabels: Record<string, string> = {
  guide: 'Guide',
  strategy: 'Strategy',
  legal: 'Legal',
  tools: 'Tools',
}

const categoryColors: Record<string, string> = {
  guide: 'bg-blue-50 text-blue-700',
  strategy: 'bg-emerald-50 text-emerald-700',
  legal: 'bg-amber-50 text-amber-700',
  tools: 'bg-purple-50 text-purple-700',
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketingHeader />

      <section className="px-6 py-16 md:py-20 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
          Brand Protection Blog
        </h1>
        <p className="mt-4 text-gray-500 max-w-lg mx-auto">
          Guides on brand bidding, competitor monitoring, and making the most of your Google Ads budget.
        </p>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl">
          {posts.length === 0 ? (
            <p className="text-center text-gray-400 py-12">Articles coming soon.</p>
          ) : (
            <div className="grid gap-6">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${categoryColors[post.category] ?? 'bg-gray-50 text-gray-700'}`}>
                      {categoryLabels[post.category] ?? post.category}
                    </span>
                    <span className="text-xs text-gray-400">{post.readingTime}</span>
                    <span className="text-xs text-gray-400">{new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                    {post.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
                    Read more <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <MarketingCta
        title="Turn blog intent into a real funnel step"
        description="If a reader is worried about competitor bidding, the fastest next step is the audit. If they already know the pain, send them to the calculator or the trial."
        secondaryHref="/calculator"
        secondaryLabel="Calculate brand campaign waste"
      />
      <MarketingFooter />
    </div>
  )
}
