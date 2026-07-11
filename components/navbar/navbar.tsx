import Link from "next/link";
import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { navLinkIds, navPath } from "./config";
import { LanguageSwitcher } from "./language-switcher";
import { NavbarMenu } from "./navbar-menu";
import { ThemeSwitcher } from "./theme-switcher";

// Server Component: prop arrays are built once per request, not per client re-render.
/* oxlint-disable react-perf/jsx-no-new-array-as-prop */

const navLinkClass =
  "text-muted-foreground hover:text-foreground text-sm transition-colors";

type NavbarProps = {
  locale: Locale;
};

export function Navbar({ locale }: NavbarProps) {
  const { nav, language, theme, locales: localeLabels } = getDictionary(locale);

  const links = navLinkIds.map((id) => ({
    href: navPath(locale, id),
    label: nav.links[id],
  }));

  const languageOptions = locales.map((code) => ({
    locale: code,
    short: localeLabels[code].short,
    name: localeLabels[code].name,
  }));

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
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={navLinkClass}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden h-full items-center md:flex" aria-hidden>
            <span className="mx-0.5 block h-6 w-px shrink-0 bg-border" />
          </div>
          <ThemeSwitcher labels={theme} />
          <LanguageSwitcher
            locale={locale}
            triggerAria={language.triggerAria}
            options={languageOptions}
          />
          <NavbarMenu
            className="md:hidden"
            menuLabel={nav.menu}
            menuTitle={nav.menuTitle}
            navAria={nav.aria}
            links={links}
          />
        </div>
      </div>
    </header>
  );
}
