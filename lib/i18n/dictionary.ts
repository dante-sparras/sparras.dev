import type { Metadata } from "next";
import { SITE_AUTHOR, SITE_NAME, SITE_URL } from "@/lib/constants";
import { dictionary as en } from "./dictionaries/en";
import { dictionary as sv } from "./dictionaries/sv";
import type { Dictionary } from "./dictionaries/types";
import type { Locale } from "./locale";

const messagesByLocale = {
  en,
  sv,
} as const satisfies Record<Locale, Dictionary>;

export function getDictionary(locale: Locale): Dictionary {
  return messagesByLocale[locale];
}

const sharedMetadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_AUTHOR,
    template: `%s · ${SITE_AUTHOR}`,
  },
  applicationName: SITE_NAME,
  authors: [{ name: SITE_AUTHOR, url: SITE_URL }],
  creator: SITE_AUTHOR,
  twitter: {
    card: "summary" as const,
    title: SITE_AUTHOR,
    creator: "@DanteSparras",
  },
  robots: { index: true, follow: true },
};

const openGraphLocale: Record<Locale, string> = {
  en: "en_US",
  sv: "sv_SE",
};

export function getSiteMetadata(locale: Locale): Metadata {
  const { meta } = getDictionary(locale);

  return {
    ...sharedMetadata,
    description: meta.description,
    keywords: [...meta.keywords],
    alternates: {
      canonical: `/${locale}`,
      languages: { en: "/en", sv: "/sv", "x-default": "/en" },
    },
    openGraph: {
      type: "website",
      locale: openGraphLocale[locale],
      url: `/${locale}`,
      siteName: SITE_NAME,
      title: SITE_AUTHOR,
      description: meta.openGraphDescription,
    },
    twitter: {
      ...sharedMetadata.twitter,
      description: meta.twitterDescription,
    },
  };
}
