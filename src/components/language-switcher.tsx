"use client";

import { CheckIcon, Languages } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import {
  isLocale,
  type Locale,
  languageNames,
  localeCookie,
  locales,
} from "@/i18n/locale";
import { cn } from "@/lib/utils";

function pathForLocale(pathname: string, locale: Locale, hash: string): Route {
  const segments = pathname.split("/");
  if (isLocale(segments[1] ?? "")) segments[1] = locale;
  return `${segments.join("/") || "/"}${hash}` as Route;
}

function useLocaleHref() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return (locale: Locale) => pathForLocale(pathname, locale, hash);
}

export function LanguageMenuItems({ lang }: { lang: Locale }) {
  const hrefFor = useLocaleHref();

  return locales.map((locale) => (
    <DropdownMenuItem
      key={locale}
      className="cursor-pointer"
      render={
        <Link
          href={hrefFor(locale)}
          hrefLang={locale}
          lang={locale}
          scroll={false}
          onClick={() => {
            // biome-ignore lint/suspicious/noDocumentCookie: the choice has to be stored before navigation
            document.cookie = localeCookie(locale);
          }}
        >
          <span className="flex-1">{languageNames[locale]}</span>
          {locale === lang ? (
            <CheckIcon aria-hidden="true" className="ml-auto size-3.5" />
          ) : null}
        </Link>
      }
    />
  ));
}

export function LanguageSwitcher({
  lang,
  menuLabel,
}: {
  lang: Locale;
  menuLabel: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${menuLabel}: ${languageNames[lang]}`}
        className={cn(
          navigationMenuTriggerStyle(),
          "size-9 shrink-0 cursor-pointer px-0",
        )}
      >
        <Languages aria-hidden="true" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label={menuLabel}>
        <LanguageMenuItems lang={lang} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
