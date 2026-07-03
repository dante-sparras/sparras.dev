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
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 border-x border-border px-3 sm:gap-4 sm:px-4">
        <Link
          href={`/${locale}`}
          className="font-mono text-sm font-medium tracking-tight shrink-0"
          aria-label={nav.logoAria}
        >
          {nav.logo}
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center gap-4 lg:gap-5 md:flex"
          aria-label={nav.aria}
        >
          {navLinkIds.map((id) => (
            <Link key={id} href={navPath(locale, id)} className={navLinkClass}>
              {nav.links[id]}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeSwitcher locale={locale} />
          <LanguageSwitcher locale={locale} />
          <NavbarMenu locale={locale} className="md:hidden" />
        </div>
      </div>
    </header>
  );
}
