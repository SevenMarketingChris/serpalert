import { remark } from 'remark'
import html from 'remark-html'

export async function BlogContent({ content }: { content: string }) {
  const result = await remark().use(html).process(content)

  return (
    <div
      className="prose prose-gray max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-strong:text-gray-900 prose-li:marker:text-gray-400"
      dangerouslySetInnerHTML={{ __html: String(result) }}
    />
  )
}
