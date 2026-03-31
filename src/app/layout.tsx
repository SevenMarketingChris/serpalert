import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
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
  title: {
    default: "SERP Alert — Protect Your Brand from Competitor Ads",
    template: "%s | SerpAlert",
  },
  description: "Monitor competitor ad activity on Google Search. Get hourly SERP alerts with screenshot evidence. Stop paying for clicks you already own.",
  robots: { index: true, follow: true },
  metadataBase: new URL("https://serpalert.co.uk"),
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "SerpAlert",
    title: "SERP Alert — Protect Your Brand from Competitor Ads",
    description: "Monitor competitor ad activity on Google Search. Get hourly SERP alerts with screenshot evidence.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SerpAlert - Brand Keyword Monitoring",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SERP Alert — Protect Your Brand from Competitor Ads",
    description: "Monitor competitor ad activity on Google Search. Get hourly SERP alerts with screenshot evidence.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
    ],
  },
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
          </ThemeProvider>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "SerpAlert",
                description: "Brand keyword monitoring tool. Get hourly SERP alerts when competitors bid on your brand name.",
                url: "https://serpalert.co.uk",
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
                  name: "SerpAlert",
                  url: "https://serpalert.co.uk",
                  logo: "https://serpalert.co.uk/favicon.ico",
                },
              }),
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
