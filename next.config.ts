import type { NextConfig } from "next";

const clerkScriptSources = [
  "https://clerk.com",
  "https://*.clerk.com",
  "https://clerk.serpalert.co.uk",
  "https://*.clerk.accounts.dev",
  "https://accounts.serpalert.co.uk",
];

const clerkConnectSources = [
  "https://clerk.com",
  "https://*.clerk.com",
  "https://clerk.serpalert.co.uk",
  "https://*.clerk.accounts.dev",
  "https://accounts.serpalert.co.uk",
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
          // Note: 'unsafe-inline' and 'unsafe-eval' are required by Clerk's SignIn/SignUp components
          // and Next.js runtime. Migrate to nonce-based CSP when Clerk supports it.
          // TODO: Add report-uri directive when CSP violation reporting endpoint is set up
          { key: 'Content-Security-Policy', value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' ${clerkScriptSources.join(' ')} https://js.stripe.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://api.dataforseo.com https://img.clerk.com https://*.clerk.serpalert.co.uk https://*.stripe.com https://accounts.serpalert.co.uk; connect-src 'self' https://serpapi.com https://api.dataforseo.com ${clerkConnectSources.join(' ')} https://api.stripe.com; font-src 'self' data:; frame-src https://clerk.serpalert.co.uk https://accounts.serpalert.co.uk https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com; worker-src blob: https://clerk.serpalert.co.uk; object-src 'none'; form-action 'self'; frame-ancestors 'none'` },
        ],
      },
    ]
  },
}

export default nextConfig;
