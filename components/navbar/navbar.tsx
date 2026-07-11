import Link from "next/link";
import { getDictionary, type Locale } from "@/lib/i18n";
import { navLinkIds, navPath } from "./config";
import { LanguageSwitcher } from "./language-switcher";
import { NavbarMenu } from "./navbar-menu";
import { ThemeSwitcher } from "./theme-switcher";

const navLinkClass =
  "text-muted-foreground hover:text-foreground text-sm transition-colors";

type NavbarProps = {
  locale: Locale;
};

export function Navbar({ locale }: NavbarProps) {
  const { nav } = getDictionary(locale);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-14 max-w-3xl items-center border-x border-border px-3 sm:px-4">
        <Link
          href={`/${locale}`}
          className="flex h-14 shrink-0 items-center font-pixel text-2xl leading-none tracking-normal text-foreground sm:text-3xl"
          aria-label={nav.logoAria}
        >
          {nav.logo}
        </Link>

        <div className="ml-auto flex h-14 min-w-0 items-center gap-2 self-stretch sm:gap-3">
          <nav
            className="hidden h-full items-center gap-4 md:flex lg:gap-5"
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
          <div className="hidden h-full items-center md:flex" aria-hidden>
            <span className="mx-0.5 block h-6 w-px shrink-0 bg-border" />
          </div>
          <ThemeSwitcher locale={locale} />
          <LanguageSwitcher locale={locale} />
          <NavbarMenu locale={locale} className="md:hidden" />
        </div>
      </div>
    </header>
  );
}
