import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import { type MadeWithLink, MadeWithLinks } from "@/components/made-with-links";
import { type NavData, NavDropdown, NavList } from "@/components/nav";
import { Providers } from "@/components/providers";
import {
  type SocialIconLink,
  SocialIconsLinks,
} from "@/components/social-icons-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";

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
const navData: NavData = [
  { title: "Home", href: "/" },
  { title: "Showcase", href: "/showcase" },
  { title: "Blog", href: "/blog" },
];
const socialLinks: SocialIconLink[] = [
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
const madeWithLinks: MadeWithLink[] = [
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
    <html
      lang="en"
      suppressHydrationWarning
      className="relative h-screen w-screen"
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex h-full w-full flex-col overflow-hidden bg-background text-foreground antialiased`}
      >
        <Providers>
          <header className="sticky top-0 z-50 mx-auto flex h-12 w-full max-w-3xl shrink-0 items-center justify-end gap-4 border-border border-x border-b bg-background px-4">
            <NavDropdown data={navData} className="flex md:hidden" />
            <NavList data={navData} className="hidden md:flex" />
            <Separator
              orientation="vertical"
              className="hidden h-4 w-px md:flex"
            />
            <ThemeToggle />
          </header>
          <div className="flex-1 overflow-y-auto">
            <main className="mx-auto w-full max-w-3xl border-border border-x bg-background">
              {children}
            </main>
            <footer className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 border-border border-x border-t px-4 py-6 md:px-6">
              <MadeWithLinks data={madeWithLinks} />
              <SocialIconsLinks data={socialLinks} />
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
