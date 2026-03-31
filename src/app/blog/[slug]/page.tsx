import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getPostBySlug, getAllSlugs } from '@/lib/blog'
import { BlogContent } from './blog-content'
import type { Metadata } from 'next'

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return {
    title: `${post.title} — SerpAlert`,
    description: post.description,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/">
            <span className="text-gradient-tech font-extrabold text-xl">SerpAlert</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/blog" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Blog</Link>
            <Link href="/audit" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Free Audit</Link>
            <Link href="/sign-up" className="inline-flex h-8 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">Start Free Trial</Link>
          </div>
        </div>
      </nav>

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

          <div className="mt-16 rounded-xl bg-indigo-50 border border-indigo-100 p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900">
              Are competitors bidding on your brand right now?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Run a free brand audit — takes 10 seconds, no signup required.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/audit" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                Free Brand Audit <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/calculator" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                or calculate your brand campaign waste →
              </Link>
            </div>
          </div>
        </div>
      </article>

      <footer className="border-t border-gray-200 bg-gray-50 px-6 py-8">
        <div className="mx-auto max-w-5xl flex items-center justify-center gap-6 text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
