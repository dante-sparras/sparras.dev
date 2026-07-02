import type { Locale } from "@/lib/i18n/config";

export const themeChoices = ["system", "light", "dark"] as const;

export type ThemeChoice = (typeof themeChoices)[number];

const labels: Record<
  Locale,
  Record<ThemeChoice, string> & {
    trigger: string;
    short: Record<ThemeChoice, string>;
  }
> = {
  en: {
    trigger: "Change theme",
    system: "System",
    light: "Light",
    dark: "Dark",
    short: { system: "Sys", light: "Light", dark: "Dark" },
  },
  sv: {
    trigger: "Byt tema",
    system: "System",
    light: "Ljust",
    dark: "Mörkt",
    short: { system: "Sys", light: "Ljust", dark: "Mörkt" },
  },
};

export function getThemeLabels(locale: Locale) {
  return labels[locale];
}
