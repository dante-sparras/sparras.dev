import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Providers } from "@/components/providers";
import { ThemeToggle } from "@/components/theme-toggle";
import { Muted } from "@/components/typography/muted";
import { Separator } from "@/components/ui/separator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dante Sparrås",
  description:
    "Personal website and portfolio of Dante Sparrås, a software developer specializing in full-stack web development and .NET development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <Providers>
          <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-50 flex h-12 items-center justify-end gap-4 px-4 bg-background border-b">
              <Nav />
              <Separator
                orientation="vertical"
                className="h-4 my-auto md:flex hidden"
              />
              <ThemeToggle />
            </header>
            <main className="flex-1 md:px-6 bg-background bg-dots-border border-border md:border-x max-w-3xl mx-auto w-full">
              {children}
            </main>
            <footer className="border-t md:px-6 px-4 pt-6 pb-12 md:pb-6 flex items-center flex-col gap-6 border-border md:border-x max-w-3xl mx-auto w-full">
              <Muted className="text-center">
                Made with{" "}
                <Link
                  href="https://nextjs.org"
                  className="text-blue-400 hover:underline"
                >
                  Next.js
                </Link>
                ,{" "}
                <Link
                  href="https://ui.shadcn.com"
                  className="text-blue-400 hover:underline"
                >
                  Shadcn/ui
                </Link>{" "}
                and{" "}
                <Link
                  href="https://tailwindcss.com"
                  className="text-blue-400 hover:underline"
                >
                  Tailwind CSS
                </Link>{" "}
                ❤️
              </Muted>
              <ul className="w-full flex flex-row justify-center">
                <li className=" size-10 flex items-center justify-center">
                  <Link href="https://x.com/DanteSparras">
                    <Image
                      src="/x.svg"
                      alt="X Logo"
                      width={16}
                      height={16}
                      className="dark:filter dark:brightness-0 dark:invert"
                    />
                  </Link>
                </li>
                <li className=" size-10 flex items-center justify-center">
                  <Link href="https://www.linkedin.com/in/dante-sparras/">
                    <Image
                      src="/linkedin.svg"
                      alt="LinkedIn Logo"
                      width={16}
                      height={16}
                      className="dark:filter dark:brightness-0 dark:invert"
                    />
                  </Link>
                </li>
                <li className=" size-10 flex items-center justify-center">
                  <Link href="https://github.com/dante-sparras">
                    <Image
                      src="/github.svg"
                      alt="GitHub Logo"
                      width={16}
                      height={16}
                      className="dark:filter dark:brightness-0 dark:invert"
                    />
                  </Link>
                </li>
              </ul>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
