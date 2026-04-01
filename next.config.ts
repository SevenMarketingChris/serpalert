import type { NextConfig } from "next";

const clerkScriptSources = [
  "https://clerk.com",
  "https://*.clerk.com",
  ...(process.env.NODE_ENV === "production" ? [] : ["https://*.clerk.accounts.dev"]),
];

const clerkConnectSources = [
  "https://clerk.com",
  "https://*.clerk.com",
  ...(process.env.NODE_ENV === "production" ? [] : ["https://*.clerk.accounts.dev"]),
];

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
          { key: 'Content-Security-Policy', value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' ${clerkScriptSources.join(' ')} https://js.stripe.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://api.dataforseo.com https://img.clerk.com https://*.stripe.com; connect-src 'self' https://serpapi.com https://api.dataforseo.com ${clerkConnectSources.join(' ')} https://api.stripe.com; font-src 'self' data:; frame-src https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com; worker-src blob:; object-src 'none'; form-action 'self'; frame-ancestors 'none'` },
        ],
      },
    ]
  },
}

export default nextConfig;
