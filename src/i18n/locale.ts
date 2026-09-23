export const locales = ["en", "sv"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const LOCALE_COOKIE = "locale";

export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const languageNames: Record<Locale, string> = {
  en: "English",
  sv: "Svenska",
};

export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}

type LanguageRange = {
  tag: string;
  quality: number;
};

function parseAcceptLanguage(header: string): LanguageRange[] {
  const ranges: LanguageRange[] = [];

  for (const part of header.split(",")) {
    const [rawTag, ...params] = part.trim().split(";");
    const tag = rawTag?.trim().toLowerCase();
    if (!tag) continue;

    let quality = 1;
    for (const param of params) {
      const [key, rawValue] = param.trim().split("=");
      if (key?.trim() !== "q") continue;
      const parsed = Number(rawValue);
      if (!Number.isNaN(parsed)) quality = parsed;
    }

    if (quality > 0) ranges.push({ tag, quality });
  }

  return ranges.sort((a, b) => b.quality - a.quality);
}

function matchLocale(tag: string): Locale | null {
  if (tag === "*") return defaultLocale;
  const language = tag.split("-")[0];
  return language === "en" || language === "sv" ? language : null;
}

export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  for (const range of parseAcceptLanguage(acceptLanguage)) {
    const locale = matchLocale(range.tag);
    if (locale) return locale;
  }

  return defaultLocale;
}

export function resolveLocale(input: {
  cookie: string | undefined;
  acceptLanguage: string | null;
}): Locale {
  if (input.cookie && isLocale(input.cookie)) return input.cookie;
  return negotiateLocale(input.acceptLanguage);
}

export function localeCookie(locale: Locale) {
  return `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
}
