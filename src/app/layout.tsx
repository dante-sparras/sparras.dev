import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Providers } from "@/components/providers";
import { ThemeToggle } from "@/components/theme-toggle";
import { Large } from "@/components/typography/large";
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
        className={`${geistSans.variable} ${geistMono.variable} flex flex-col h-screen overflow-hidden`}
      >
        <Providers>
          <header className="w-full flex h-12 items-center justify-end gap-4 px-4 md:max-w-3xl md:mx-auto md:px-6 border-l border-r border-b border-border bg-background/80 backdrop-blur-md z-50">
            <Nav />
            <Separator
              orientation="vertical"
              className="h-4 my-auto md:flex hidden"
            />
            <ThemeToggle />
          </header>
          <div className="flex-1 w-full overflow-y-auto overscroll-y-auto border-l border-r border-border bg-dots-border md:max-w-3xl md:mx-auto md:px-6 flex flex-col">
            <main className="flex">{children}</main>
            <footer className="flex">
              <Large>
                &copy; {new Date().getFullYear()} Dante Sparrås. All rights
              </Large>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
