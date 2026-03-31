import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: '.',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev https://*.clerk.com https://js.stripe.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://api.dataforseo.com https://img.clerk.com https://*.stripe.com; connect-src 'self' https://serpapi.com https://api.dataforseo.com https://clerk.com https://*.clerk.accounts.dev https://*.clerk.com https://api.stripe.com; font-src 'self' data:; frame-src https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com; worker-src blob:; frame-ancestors 'none'" },
        ],
      },
    ]
  },
}

export default nextConfig;
