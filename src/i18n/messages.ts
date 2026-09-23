import type { Locale } from "@/i18n/locale";

type Messages = {
  mainNavigation: string;
  profileDetails: string;
  language: string;
  showMore: string;
  showLess: string;
  localTime: string;
  sameTime: string;
  ahead: string;
  behind: string;
  bannerAlt: string;
  logoAlt: (platform: string) => string;
};

export const messages: Record<Locale, Messages> = {
  en: {
    mainNavigation: "Main navigation",
    profileDetails: "Profile details",
    language: "Language",
    showMore: "Show More",
    showLess: "Show Less",
    localTime: "Local time",
    sameTime: "same time",
    ahead: "ahead",
    behind: "behind",
    bannerAlt: "Pixel black hole accretion disk",
    logoAlt: (platform) => `${platform} Logo`,
  },
  sv: {
    mainNavigation: "Huvudnavigering",
    profileDetails: "Profiluppgifter",
    language: "Språk",
    showMore: "Visa mer",
    showLess: "Visa mindre",
    localTime: "Lokal tid",
    sameTime: "samma tid",
    ahead: "före",
    behind: "efter",
    bannerAlt: "Pixelkonst av ett svart håls ackretionsskiva",
    logoAlt: (platform) => `${platform}-logotyp`,
  },
};

export function getMessages(locale: Locale) {
  return messages[locale];
}
