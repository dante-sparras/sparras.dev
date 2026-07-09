import type { Dictionary } from "./types";

export const dictionary = {
  locales: {
    en: { short: "EN", name: "English" },
    sv: { short: "SV", name: "Swedish" },
  },
  language: {
    triggerAria: "Change language",
  },
  theme: {
    triggerAria: "Change theme",
    system: "System",
    light: "Light",
    dark: "Dark",
  },
  home: {
    hero: {
      name: "Dante Sparrås",
      role: "Future .NET Developer",
      avatarAlt: "Portrait of Dante Sparrås",
      student: "Student at YH Akademin",
      location: "Norrköping, Sweden",
      pronouns: "he/him",
      weatherPlace: "Norrköping",
    },
  },
  nav: {
    aria: "Primary",
    menu: "Open menu",
    menuTitle: "Menu",
    logo: "D.S",
    logoAria: "Dante Sparrås — home",
    links: {
      about: "About",
      work: "Work",
      resume: "Resume",
      contact: "Contact",
    },
  },
  pages: {
    about: {
      title: "About",
      description: "Background, approach, and what I care about — coming soon.",
    },
    work: {
      title: "Work",
      description: "Selected projects and case studies — coming soon.",
    },
    resume: {
      title: "Resume",
      description:
        "Tailored résumé views and PDF downloads will live here — coming soon.",
    },
    contact: {
      title: "Contact",
      description: "Ways to reach me — coming soon.",
    },
  },
  meta: {
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
    openGraphDescription:
      "Full-stack and game developer portfolio — web, games, and thoughtful system design.",
    twitterDescription:
      "Full-stack and game developer portfolio — web, games, and thoughtful system design.",
  },
} as const satisfies Dictionary;
