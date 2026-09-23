import type { Metadata } from "next";
import { Geist, Geist_Mono, Geist_Pixel } from "next/font/google";
import "./globals.css";
import { MenuIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { sections } from "@/content/outline";
import { profile } from "@/content/profile";
import { cn } from "@/lib/utils";

// #region FONTS
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
// #endregion

// #region METADATA
export const metadata: Metadata = {
  title: profile.name,
  description: profile.summary,
};
// #endregion

const navLinks = sections.map((entry) => ({
  title: entry.title,
  href: `#${entry.id}` as const,
}));

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
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
                aria-label="Main navigation"
              >
                {navLinks.map((link) => (
                  <DropdownMenuItem
                    key={link.title}
                    render={<Link href={link.href}>{link.title}</Link>}
                    className="cursor-pointer"
                  />
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <nav className="hidden md:flex" aria-label="Main navigation">
              <ul className="flex items-center">
                {navLinks.map((link) => (
                  <li key={link.title}>
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
                    alt={`${link.platform} Logo`}
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
