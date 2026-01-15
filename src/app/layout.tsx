import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Providers } from "@/components/providers";
import { ThemeToggle } from "@/components/theme-toggle";
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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>
          <header className="sticky top-0 z-50 flex h-12 items-center justify-end gap-4 px-4 md:max-w-3xl md:mx-auto md:px-6 border-l border-r border-b border-border bg-background/80 backdrop-blur-md">
            <Nav />
            <Separator
              orientation="vertical"
              className="h-4 my-auto md:flex hidden"
            />
            <ThemeToggle />
          </header>
          <main className="md:max-w-3xl md:mx-auto md:px-6 border-l border-r border-border bg-dots-border">
            {children}
          </main>
          <footer></footer>
        </Providers>
      </body>
    </html>
  );
}
