import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  defaultLocale,
  isLocale,
  localeFromAcceptLanguage,
  pathnameHasLocale,
} from "@/lib/i18n";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathnameHasLocale(pathname)) {
    const segment = pathname.split("/")[1] ?? defaultLocale;
    const locale = isLocale(segment) ? segment : defaultLocale;
    const response = NextResponse.next();
    response.headers.set("x-locale", locale);
    return response;
  }

  const locale = localeFromAcceptLanguage(
    request.headers.get("accept-language"),
  );
  const suffix = pathname === "/" ? "" : pathname;
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${suffix}`;

  const response = NextResponse.redirect(url);
  response.headers.set("x-locale", locale);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
