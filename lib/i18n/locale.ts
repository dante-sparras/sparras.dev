import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "./dictionary";
import type { Dictionary } from "./dictionaries/types";

// ── Locale set ──────────────────────────────────────────────────────────────

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
    .toSorted((a, b) => b.q - a.q);

  for (const { lang } of parsed) {
    if (lang === "sv") return "sv";
    if (lang === "en") return "en";
  }

  return defaultLocale;
}

// ── Paths ───────────────────────────────────────────────────────────────────

/** True when the first path segment is a known locale. */
export function pathnameHasLocale(pathname: string): boolean {
  return locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
}

/** Path without the leading locale segment (`/sv/foo` → `/foo`, `/en` → `/`). */
export function pathnameWithoutLocale(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (first && isLocale(first)) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname || "/";
}

export function localizedPath(locale: Locale, pathname: string): string {
  const rest = pathnameWithoutLocale(pathname);
  if (rest === "/") return `/${locale}`;
  return `/${locale}${rest}`;
}

// ── Route params ────────────────────────────────────────────────────────────

export type LocaleParams = {
  params: Promise<{ locale: string }>;
};

/** Resolve a valid locale from route params, or 404. */
export async function requireLocale(
  params: Promise<{ locale: string }>,
): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

type PageKey = keyof Dictionary["pages"];

/** Title metadata for a static dictionary page. */
export async function pageTitleMetadata(
  params: Promise<{ locale: string }>,
  key: PageKey,
): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).pages[key].title };
}

/** Dictionary page copy for a static route. */
export async function getPageCopy(
  params: Promise<{ locale: string }>,
  key: PageKey,
) {
  const locale = await requireLocale(params);
  return getDictionary(locale).pages[key];
}
