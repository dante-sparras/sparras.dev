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
    short: {
      system: "Sys",
      light: "Light",
      dark: "Dark",
    },
  },
  home: {
    title: "Dante Sparrås",
    description:
      "Full-stack and game developer — portfolio site under construction.",
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
