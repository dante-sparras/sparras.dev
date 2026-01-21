import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MenuIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { Providers } from "@/components/providers";
import { Muted } from "@/components/typography/muted";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
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
  { title: "Projects", href: "#projects" },
  { title: "Blog", href: "#blog" },
];
const socialLinks: {
  title: string;
  href: React.ComponentProps<typeof Link>["href"];
  src: React.ComponentProps<typeof Image>["src"];
}[] = [
  {
    title: "X",
    href: "https://x.com/DanteSparras",
    src: "/icons/x.svg",
  },
  {
    title: "LinkedIn",
    href: "https://www.linkedin.com/in/dante-sparras/",
    src: "/icons/linkedin.svg",
  },
  {
    title: "GitHub",
    href: "https://github.com/dante-sparras",
    src: "/icons/github.svg",
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
    <html lang="en" className="scheme-dark scroll-smooth">
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
                  aria-label="Main navigation"
                >
                  {navData.map((link) => (
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
                  {navData.map((link) => (
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
                  <Link href={link.href}>
                    <Image
                      src={link.src}
                      alt={`${link.title} Logo`}
                      width={16}
                      height={16}
                      className="size-4 object-contain brightness-0 invert filter"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
