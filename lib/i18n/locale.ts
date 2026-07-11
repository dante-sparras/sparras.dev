import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "./config";
import { getDictionary } from "./get-dictionary";
import type { Dictionary } from "./dictionaries/types";

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
