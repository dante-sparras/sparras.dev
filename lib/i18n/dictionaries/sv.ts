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
    hero: {
      name: "Dante Sparrås",
      role: "Framtida .NET-utvecklare",
      avatarAlt: "Porträtt av Dante Sparrås",
      student: "Student vid YH Akademin",
      location: "Norrköping, Sverige",
      pronouns: "han/honom",
      weatherPlace: "Norrköping",
    },
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
      description: "Utvalda projekt och case studies — kommer snart.",
    },
    resume: {
      title: "CV",
      description:
        "Skräddarsydda CV-vyer och PDF-nedladdningar hamnar här — kommer snart.",
    },
    contact: {
      title: "Kontakt",
      description: "Sätt att nå mig — kommer snart.",
    },
  },
  meta: {
    description:
      "Portfölj för Dante Sparrås — fullstack- och spelutvecklare med fokus på ren arkitektur, modulära system och stark DX och UX. Webb med Next.js, spel och .NET.",
    keywords: [
      "Dante Sparrås",
      "fullstackutvecklare",
      "spelutvecklare",
      "Next.js",
      "portfölj",
      "Norrköping",
      "Sverige",
    ],
    openGraphDescription:
      "Fullstack- och spelutvecklarportfölj — webb, spel och genomtänkt systemdesign.",
    twitterDescription:
      "Fullstack- och spelutvecklarportfölj — webb, spel och genomtänkt systemdesign.",
  },
} as const satisfies Dictionary;
