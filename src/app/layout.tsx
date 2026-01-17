import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Providers } from "@/components/providers";
import { ThemeToggle } from "@/components/theme-toggle";
import { Large } from "@/components/typography/large";
import { Lead } from "@/components/typography/lead";
import { Muted } from "@/components/typography/muted";
import { Small } from "@/components/typography/small";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    <html lang="en" suppressHydrationWarning className="overflow-hidden">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <Providers>
          <ScrollArea className="w-full h-screen **:data-[slot='scroll-area-viewport']:overscroll-none **:data-[slot='scroll-area-viewport']:*:border-border **:data-[slot='scroll-area-viewport']:*:border-x **:data-[slot='scroll-area-viewport']:*:max-w-3xl **:data-[slot='scroll-area-viewport']:*:mx-auto">
            <header className="sticky top-0 flex h-12 items-center justify-end gap-4 px-4 bg-background/80 backdrop-blur-lg border-b">
              <Nav />
              <Separator
                orientation="vertical"
                className="h-4 my-auto md:flex hidden"
              />
              <ThemeToggle />
            </header>
            <main className="min-h-full md:px-6 bg-background bg-dots-border">
              {children}
            </main>
            <footer className="border-t md:px-6 px-4 py-6 flex justify-center">
              <Muted>
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
            </footer>
          </ScrollArea>
        </Providers>
      </body>
    </html>
  );
}
