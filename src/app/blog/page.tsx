import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getAllPosts } from '@/lib/blog'

export const metadata = {
  title: 'Blog — SerpAlert',
  description: 'Guides on brand bidding, Google Ads brand protection, competitor ad monitoring, and saving wasted brand campaign spend.',
}

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
      <nav className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/">
            <span className="text-gradient-tech font-extrabold text-xl">SerpAlert</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Pricing</Link>
            <Link href="/audit" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Free Audit</Link>
            <Link href="/sign-up" className="inline-flex h-8 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">Start Free Trial</Link>
          </div>
        </div>
      </nav>

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

      <section className="bg-white border-t border-gray-200 px-6 py-16 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
          Are competitors bidding on your brand?
        </h2>
        <p className="mt-3 text-gray-500 max-w-md mx-auto">
          Find out in 10 seconds with a free brand audit.
        </p>
        <div className="mt-6">
          <Link href="/audit" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            Free Brand Audit <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-gray-50 px-6 py-8">
        <div className="mx-auto max-w-5xl flex items-center justify-center gap-6 text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
