import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { createPageMetadata, siteConfig } from "@/lib/metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  ...createPageMetadata(),
  title: {
    default: `${siteConfig.name} | ${siteConfig.defaultTitle}`,
    template: `%s | ${siteConfig.name}`,
  },
  robots: { index: true, follow: true },
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  category: "Marketing",
  referrer: "origin-when-cross-origin",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
  other: [{ name: "theme-color", content: "#6366f1" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        <body className="antialiased">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
          >
            Skip to main content
          </a>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            disableTransitionOnChange
          >
            <div id="main-content">{children}</div>
            <Toaster position="bottom-right" richColors closeButton />
          </ThemeProvider>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: siteConfig.name,
                description:
                  "Brand keyword monitoring tool. Get hourly SERP alerts when competitors bid on your brand name.",
                url: siteConfig.url,
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web",
                offers: {
                  "@type": "Offer",
                  price: "149",
                  priceCurrency: "GBP",
                  priceSpecification: {
                    "@type": "UnitPriceSpecification",
                    price: "149",
                    priceCurrency: "GBP",
                    billingDuration: "P1M",
                  },
                },
                provider: {
                  "@type": "Organization",
                  name: siteConfig.name,
                  url: siteConfig.url,
                  logo: `${siteConfig.url}/favicon.ico`,
                },
              }),
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
