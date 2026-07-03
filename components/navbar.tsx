import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { navLinkIds, navPath } from "@/lib/nav/config";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NavbarMenu } from "@/components/navbar-menu";
import { ThemeSwitcher } from "@/components/theme-switcher";

const navLinkClass =
  "text-muted-foreground hover:text-foreground text-sm transition-colors";

type NavbarProps = {
  locale: Locale;
};

export function Navbar({ locale }: NavbarProps) {
  const { nav } = getDictionary(locale);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-3xl items-center border-x border-border px-3 sm:px-4">
        <Link
          href={`/${locale}`}
          className="font-pixel text-2xl leading-none tracking-normal text-foreground shrink-0 sm:text-3xl"
          aria-label={nav.logoAria}
        >
          {nav.logo}
        </Link>

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <nav
            className="hidden items-center gap-4 lg:gap-5 md:flex"
            aria-label={nav.aria}
          >
            {navLinkIds.map((id) => (
              <Link
                key={id}
                href={navPath(locale, id)}
                className={navLinkClass}
              >
                {nav.links[id]}
              </Link>
            ))}
          </nav>
          <ThemeSwitcher locale={locale} />
          <LanguageSwitcher locale={locale} />
          <NavbarMenu locale={locale} className="md:hidden" />
        </div>
      </div>
    </header>
  );
}
