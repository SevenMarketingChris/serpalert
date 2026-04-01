import type { Metadata } from "next";

const SITE_URL = "https://serpalert.co.uk";
const SITE_NAME = "SerpAlert";
const DEFAULT_TITLE = "Protect Your Brand from Competitor Ads";
const DEFAULT_DESCRIPTION =
  "Monitor competitor ad activity on Google Search. Get hourly SERP alerts with screenshot evidence and stop paying for clicks you already own.";
const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";

type MetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
  type?: "website" | "article";
  publishedTime?: string;
};

export const siteConfig = {
  name: SITE_NAME,
  url: SITE_URL,
  defaultTitle: DEFAULT_TITLE,
  defaultDescription: DEFAULT_DESCRIPTION,
  ogImagePath: DEFAULT_OG_IMAGE_PATH,
};

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function createPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  keywords,
  type = "website",
  publishedTime,
}: MetadataOptions = {}): Metadata {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | ${DEFAULT_TITLE}`;
  const canonicalUrl = absoluteUrl(path);
  const ogImage = absoluteUrl(DEFAULT_OG_IMAGE_PATH);

  return {
    title: title ?? `${SITE_NAME} | ${DEFAULT_TITLE}`,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: "en_GB",
      type,
      ...(publishedTime ? { publishedTime } : {}),
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [ogImage],
    },
  };
}
