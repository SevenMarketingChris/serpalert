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
    default: "SerpAlert — Brand Protection & Competitor Ad Monitoring",
    template: "%s | SerpAlert",
  },
  description: "Monitor your brand keywords on Google Search. Get alerted within the hour when competitors bid on your brand terms, with SERP screenshots as evidence.",
  metadataBase: new URL("https://serpalert.co.uk"),
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://serpalert.co.uk",
    siteName: "SerpAlert",
    title: "SerpAlert — Brand Protection & Competitor Ad Monitoring",
    description: "Monitor your brand keywords on Google Search. Get alerted within the hour when competitors bid on your brand terms, with SERP screenshots as evidence.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SerpAlert — Brand Protection & Competitor Ad Monitoring",
    description: "Monitor your brand keywords on Google Search. Get alerted within the hour when competitors bid on your brand terms.",
  },
  alternates: {
    canonical: "https://serpalert.co.uk",
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
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
