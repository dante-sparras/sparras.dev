import type { Metadata } from "next";
import { dictionary as en } from "./dictionaries/en";
import { dictionary as sv } from "./dictionaries/sv";
import type { Dictionary } from "./dictionaries/types";
import type { Locale } from "./config";

const messagesByLocale = {
  en,
  sv,
} as const satisfies Record<Locale, Dictionary>;

export function getDictionary(locale: Locale): Dictionary {
  return messagesByLocale[locale];
}

const sharedMetadata = {
  metadataBase: new URL("https://sparras.dev"),
  title: {
    default: "Dante Sparrås",
    template: "%s · Dante Sparrås",
  },
  applicationName: "sparras.dev",
  authors: [{ name: "Dante Sparrås", url: "https://sparras.dev" }],
  creator: "Dante Sparrås",
  twitter: {
    card: "summary" as const,
    title: "Dante Sparrås",
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
      siteName: "sparras.dev",
      title: "Dante Sparrås",
      description: meta.openGraphDescription,
    },
    twitter: {
      ...sharedMetadata.twitter,
      description: meta.twitterDescription,
    },
  };
}
