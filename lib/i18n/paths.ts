import { type Locale, locales } from "./config";

/** Path without the leading locale segment (e.g. `/sv/foo` → `/foo`, `/en` → `/`). */
export function pathnameWithoutLocale(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (first && locales.includes(first as Locale)) {
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
