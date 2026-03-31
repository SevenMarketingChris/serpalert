import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/admin/', '/api/', '/sign-in', '/sign-up', '/client/'],
    },
    sitemap: 'https://serpalert.co.uk/sitemap.xml',
  }
}
