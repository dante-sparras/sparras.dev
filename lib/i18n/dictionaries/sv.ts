import type { Dictionary } from "./types";

export const dictionary = {
  locales: {
    en: { short: "EN", name: "Engelska" },
    sv: { short: "SV", name: "Svenska" },
  },
  language: {
    triggerAria: "Byt språk",
  },
  theme: {
    triggerAria: "Byt tema",
    system: "System",
    light: "Ljust",
    dark: "Mörkt",
  },
  home: {
    title: "Dante Sparrås",
    description: "Fullstack- och spelutvecklare — webbplatsen byggs om.",
  },
  nav: {
    aria: "Huvudnavigering",
    menu: "Öppna meny",
    menuTitle: "Meny",
    logo: "D.S",
    logoAria: "Dante Sparrås — startsida",
    links: {
      about: "Om",
      work: "Arbete",
      resume: "CV",
      contact: "Kontakt",
    },
  },
  pages: {
    about: {
      title: "Om",
      description:
        "Bakgrund, arbetssätt och vad som driver mig — kommer snart.",
    },
    work: {
      title: "Arbete",
      description: "Utvalda projekt och case — kommer snart.",
    },
    resume: {
      title: "CV",
      description:
        "Anpassade CV-vyer och PDF-nedladdningar kommer finnas här — kommer snart.",
    },
    contact: {
      title: "Kontakt",
      description: "Sätt att nå mig — kommer snart.",
    },
  },
  meta: {
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
    openGraphDescription:
      "Portfolio för fullstack- och spelutvecklare — webb, spel och genomtänkt systemdesign.",
    twitterDescription:
      "Portfolio för fullstack- och spelutvecklare — webb, spel och genomtänkt systemdesign.",
  },
} as const satisfies Dictionary;
