export type SiteInfo = {
  logoUrl: string | null
  description: string | null
  tagline: string | null
  phone: string | null
}

function resolveUrl(path: string | null | undefined, base: string): string | null {
  if (!path) return null
  try {
    return new URL(path, base).toString()
  } catch {
    return null
  }
}

function extractMeta(html: string, ...names: string[]): string | null {
  for (const name of names) {
    // <meta name/property="..." content="...">
    const m1 = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
    if (m1?.[1]) return m1[1].trim()
    // <meta content="..." name/property="...">
    const m2 = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, 'i'))
    if (m2?.[1]) return m2[1].trim()
  }
  return null
}

export async function scrapeSiteInfo(websiteUrl: string): Promise<SiteInfo> {
  try {
    const res = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
      signal: AbortSignal.timeout(12000),
    })

    if (!res.ok) return { logoUrl: null, description: null, tagline: null, phone: null }
    const html = await res.text()
    const base = websiteUrl

    // Logo: prefer apple-touch-icon (clean, square, usually brand logo)
    // then og:image (might be a banner), then high-res favicon
    const appleIcon = html.match(/<link[^>]+rel=["']apple-touch-icon(?:-precomposed)?["'][^>]+href=["']([^"']+)["']/i)?.[1]
      || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon(?:-precomposed)?["']/i)?.[1]

    // Try manifest for logo
    const manifestHref = html.match(/<link[^>]+rel=["']manifest["'][^>]+href=["']([^"']+)["']/i)?.[1]

    // og:image as fallback (only if it looks like a logo, not a photo)
    const ogImage = extractMeta(html, 'og:image')

    // Pick best logo
    let logoUrl: string | null = null
    if (appleIcon) {
      logoUrl = resolveUrl(appleIcon, base)
    } else if (ogImage && !ogImage.match(/\.(jpg|jpeg)$/i)) {
      // Prefer non-JPEG og:images (logos tend to be PNG/SVG/WebP)
      logoUrl = resolveUrl(ogImage, base)
    } else if (ogImage) {
      logoUrl = resolveUrl(ogImage, base)
    }

    // If no logo yet, try to get it from web manifest
    if (!logoUrl && manifestHref) {
      try {
        const manifestUrl = resolveUrl(manifestHref, base)!
        const manifest = await fetch(manifestUrl, { signal: AbortSignal.timeout(5000) }).then(r => r.json())
        const icon = manifest?.icons?.find((i: { purpose?: string }) => i.purpose?.includes('any') || !i.purpose)
          || manifest?.icons?.[manifest.icons.length - 1]
        if (icon?.src) logoUrl = resolveUrl(icon.src, base)
      } catch {
        // ignore
      }
    }

    // Description: meta description > og:description > twitter:description
    const description = extractMeta(html, 'description', 'og:description', 'twitter:description')

    // Tagline: og:site_name won't have it, but sometimes twitter:title differs from og:title
    // Look for a slogan in schema.org
    const sloganMatch = html.match(/"slogan"\s*:\s*"([^"]{5,100})"/i)
    const tagline = sloganMatch?.[1]?.trim() || null

    // Phone: look for tel: links or schema.org telephone
    const telLink = html.match(/href=["']tel:([+\d\s().-]{7,20})["']/i)?.[1]
    const schemaTel = html.match(/"telephone"\s*:\s*"([^"]{7,20})"/i)?.[1]
    const phone = (telLink || schemaTel)?.trim() || null

    return { logoUrl, description, tagline, phone }
  } catch {
    return { logoUrl: null, description: null, tagline: null, phone: null }
  }
}
