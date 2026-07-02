export const locales = ["en", "sv"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

/** Pick en or sv from Accept-Language; otherwise default (en). */
export function localeFromAcceptLanguage(
  header: string | null | undefined,
): Locale {
  if (!header) return defaultLocale;

  const parsed = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const lang = tag.split("-")[0]?.toLowerCase() ?? "";
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.split("=")[1] ?? "1") : 1;
      return { lang, q: Number.isFinite(q) ? q : 0 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of parsed) {
    if (lang === "sv") return "sv";
    if (lang === "en") return "en";
  }

  return defaultLocale;
}
