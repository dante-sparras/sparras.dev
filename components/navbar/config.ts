import type { Locale } from "@/lib/i18n";

export const navLinkIds = ["about", "work", "resume", "contact"] as const;

export type NavLinkId = (typeof navLinkIds)[number];

export function navPath(locale: Locale, id: NavLinkId): string {
  return `/${locale}/${id}`;
}
