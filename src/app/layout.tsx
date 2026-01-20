import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MenuIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Providers } from "@/components/providers";
import { ThemeToggle } from "@/components/theme-toggle";
import { Muted } from "@/components/typography/muted";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
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
// #endregion

// #region METADATA
export const metadata: Metadata = {
  title: "Dante Sparrås",
  description:
    "Personal website and portfolio of Dante Sparrås, a software developer specializing in full-stack web development and .NET development.",
};
// #endregion

// #region DATA
const navData: {
  title: string;
  href: React.ComponentProps<typeof Link>["href"];
}[] = [
  { title: "Home", href: "/" },
  { title: "Showcase", href: "/showcase" },
  { title: "Blog", href: "/blog" },
];
const socialLinks: {
  href: React.ComponentProps<typeof Link>["href"];
  icon: React.ReactNode;
}[] = [
  {
    href: "https://x.com/DanteSparras",
    icon: (
      <Image
        src="/x.svg"
        alt="X Logo"
        width={16}
        height={16}
        className="dark:brightness-0 dark:invert dark:filter"
      />
    ),
  },
  {
    href: "https://www.linkedin.com/in/dante-sparras/",
    icon: (
      <Image
        src="/linkedin.svg"
        alt="LinkedIn Logo"
        width={16}
        height={16}
        className="dark:brightness-0 dark:invert dark:filter"
      />
    ),
  },
  {
    href: "https://github.com/dante-sparras",
    icon: (
      <Image
        src="/github.svg"
        alt="GitHub Logo"
        width={16}
        height={16}
        className="dark:brightness-0 dark:invert dark:filter"
      />
    ),
  },
];
const madeWithLinks: {
  href: React.ComponentProps<typeof Link>["href"];
  title: string;
}[] = [
  {
    href: "https://nextjs.org",
    title: "Next.js",
  },
  {
    href: "https://ui.shadcn.com",
    title: "Shadcn/ui",
  },
  {
    href: "https://tailwindcss.com",
    title: "Tailwind CSS",
  },
];
// #endregion

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background font-mono text-foreground antialiased`}
      >
        <Providers>
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
                  render={
                    <nav aria-label="Main navigation">
                      {navData.map((link) => (
                        <DropdownMenuItem
                          key={link.title}
                          render={<Link href={link.href}>{link.title}</Link>}
                          className="cursor-pointer"
                        />
                      ))}
                    </nav>
                  }
                ></DropdownMenuContent>
              </DropdownMenu>
              <NavigationMenu
                className="hidden md:flex"
                aria-label="Main navigation"
              >
                <NavigationMenuList>
                  {navData.map((link) => (
                    <NavigationMenuItem key={link.title}>
                      <NavigationMenuLink
                        className={cn(navigationMenuTriggerStyle(), "h-9")}
                        render={<Link href={link.href}>{link.title}</Link>}
                      ></NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
              <Separator
                orientation="vertical"
                className="hidden md:flex md:h-4"
              />
              <ThemeToggle className="size-9 *:p-2" />
            </header>
          </div>

          <main className="mx-auto max-w-3xl md:border-x">{children}</main>

          <footer className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-6 md:border-x md:px-6">
            <Muted className="text-center">
              Made with{" "}
              {madeWithLinks.map((link) => (
                <React.Fragment key={link.href.toString()}>
                  <Link
                    href={link.href}
                    className="text-blue-400 hover:underline"
                  >
                    {link.title}
                  </Link>{" "}
                </React.Fragment>
              ))}
              ❤️
            </Muted>
            <ul className="flex w-full flex-row justify-center">
              {socialLinks.map((link) => (
                <li
                  key={link.href.toString()}
                  className="flex size-10 items-center justify-center"
                >
                  <Link href={link.href}>{link.icon}</Link>
                </li>
              ))}
            </ul>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
