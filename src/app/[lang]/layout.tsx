import { MenuIcon } from "lucide-react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Geist_Pixel } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { getSections } from "@/content/outline";
import { getProfile } from "@/content/profile";
import { isLocale, locales } from "@/i18n/locale";
import { getMessages } from "@/i18n/messages";
import { cn } from "@/lib/utils";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const geistPixel = Geist_Pixel({
  variable: "--font-geist-pixel",
  subsets: ["latin", "latin-ext"],
  axes: ["ELSH"],
  adjustFontFallback: false,
});

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const profile = getProfile(lang);
  return {
    title: profile.name,
    description: profile.summary,
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const profile = getProfile(lang);
  const messages = getMessages(lang);
  const navLinks = getSections(lang).map((entry) => ({
    id: entry.id,
    title: entry.title,
    href: `#${entry.id}` as const,
  }));

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} ${geistPixel.variable} scheme-dark scroll-smooth`}
    >
      <body className="bg-background font-sans text-foreground antialiased">
        <div className="sticky top-0 z-50 mx-auto max-w-3xl md:border-x">
          <header className="flex h-14 items-center justify-end gap-4 border-b bg-background px-4 py-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  navigationMenuTriggerStyle(),
                  "mr-auto flex size-9 cursor-pointer px-0 md:hidden",
                )}
              >
                <MenuIcon className="size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="md:hidden"
                aria-label={messages.mainNavigation}
              >
                {navLinks.map((link) => (
                  <DropdownMenuItem
                    key={link.id}
                    render={<Link href={link.href}>{link.title}</Link>}
                    className="cursor-pointer"
                  />
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <nav
              className="hidden md:flex"
              aria-label={messages.mainNavigation}
            >
              <ul className="flex items-center">
                {navLinks.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      className={cn(navigationMenuTriggerStyle(), "h-9")}
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <LanguageSwitcher lang={lang} menuLabel={messages.language} />
          </header>
        </div>

        <main className="mx-auto max-w-3xl md:border-x">{children}</main>

        <footer className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-6 md:border-x md:px-6">
          <ul className="flex w-full flex-row justify-center">
            {profile.socialLinks.map((link) => (
              <li
                key={link.platform}
                className="flex size-10 items-center justify-center"
              >
                <Link href={link.href}>
                  <Image
                    src={link.iconSrc}
                    alt={messages.logoAlt(link.platform)}
                    width={16}
                    height={16}
                    className="size-4 object-contain brightness-0 invert filter"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </footer>
      </body>
    </html>
  );
}
