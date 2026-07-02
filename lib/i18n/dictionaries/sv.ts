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
    short: {
      system: "Sys",
      light: "Ljust",
      dark: "Mörkt",
    },
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
    resume: "CV",
    links: {
      about: "Om",
      skills: "Kompetens",
      portfolio: "Portfolio",
      testimonials: "Referenser",
      contact: "Kontakt",
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
