import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MarketingCta } from '@/components/marketing-cta'
import { MarketingFooter } from '@/components/marketing-footer'
import { MarketingHeader } from '@/components/marketing-header'
import { getPostBySlug, getAllSlugs } from '@/lib/blog'
import { BlogContent } from './blog-content'
import type { Metadata } from 'next'
import { absoluteUrl, createPageMetadata } from '@/lib/metadata'

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  const pageMetadata = createPageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    type: 'article',
    publishedTime: post.date,
  })

  return {
    ...pageMetadata,
    authors: [{ name: post.author }],
    other: {
      'article:published_time': post.date,
      'article:author': post.author,
    },
    alternates: {
      canonical: absoluteUrl(`/blog/${post.slug}`),
    },
    title: post.title,
    description: post.description,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketingHeader />

      <article className="px-6 py-12 md:py-16">
        <div className="mx-auto max-w-2xl">
          <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to blog
          </Link>

          <header className="mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">
              {post.title}
            </h1>
            <div className="mt-4 flex items-center gap-3 text-sm text-gray-400">
              <span>{new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span>&middot;</span>
              <span>{post.readingTime}</span>
              <span>&middot;</span>
              <span>{post.author}</span>
            </div>
          </header>

          <BlogContent content={post.content} />

          <div className="mt-16">
            <MarketingCta
              title="See whether this problem is live on your brand"
              description="Run the free audit to check your keyword right now, or use the calculator if you want to quantify the cost of staying defensive."
              secondaryHref="/calculator"
              secondaryLabel="Calculate brand campaign waste"
            />
          </div>
        </div>
      </article>
      <MarketingFooter />
    </div>
  )
}
