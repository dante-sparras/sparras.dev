import type { Metadata } from "next";
import type { Locale } from "./config";

export type SiteDictionary = {
  metadata: Metadata;
  home: {
    title: string;
    description: string;
  };
};

const shared = {
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

const dictionaries: Record<Locale, SiteDictionary> = {
  en: {
    metadata: {
      ...shared,
      description:
        "Portfolio of Dante Sparrås — full-stack and game developer focused on clean architecture, modular systems, and strong DX and UX. Web with Next.js, games, and .NET.",
      keywords: [
        "Dante Sparrås",
        "full-stack developer",
        "game developer",
        "Next.js",
        "portfolio",
        "Norrköping",
        "Sweden",
      ],
      alternates: {
        canonical: "/en",
        languages: { en: "/en", sv: "/sv", "x-default": "/en" },
      },
      openGraph: {
        type: "website",
        locale: "en_US",
        url: "/en",
        siteName: "sparras.dev",
        title: "Dante Sparrås",
        description:
          "Full-stack and game developer portfolio — web, games, and thoughtful system design.",
      },
      twitter: {
        ...shared.twitter,
        description:
          "Full-stack and game developer portfolio — web, games, and thoughtful system design.",
      },
    },
    home: {
      title: "Dante Sparrås",
      description:
        "Full-stack and game developer — portfolio site under construction.",
    },
  },
  sv: {
    metadata: {
      ...shared,
      description:
        "Portfolio för Dante Sparrås — fullstack- och spelutvecklare med fokus på ren arkitektur, modulära system och bra DX och UX. Webb med Next.js, spel och .NET.",
      keywords: [
        "Dante Sparrås",
        "fullstackutvecklare",
        "spelutvecklare",
        "Next.js",
        "portfolio",
        "Norrköping",
        "Sverige",
      ],
      alternates: {
        canonical: "/sv",
        languages: { en: "/en", sv: "/sv", "x-default": "/en" },
      },
      openGraph: {
        type: "website",
        locale: "sv_SE",
        url: "/sv",
        siteName: "sparras.dev",
        title: "Dante Sparrås",
        description:
          "Portfolio för fullstack- och spelutvecklare — webb, spel och genomtänkt systemdesign.",
      },
      twitter: {
        ...shared.twitter,
        description:
          "Portfolio för fullstack- och spelutvecklare — webb, spel och genomtänkt systemdesign.",
      },
    },
    home: {
      title: "Dante Sparrås",
      description: "Fullstack- och spelutvecklare — webbplatsen byggs om.",
    },
  },
};

export function getDictionary(locale: Locale): SiteDictionary {
  return dictionaries[locale];
}
