import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Providers } from "@/components/providers";
import { ThemeToggle } from "@/components/theme-toggle";
import { Large } from "@/components/typography/large";
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-screen overflow-hidden bg-background text-foreground antialiased`}
      >
        <Providers>
          <header className="w-full flex h-12 items-center justify-end gap-4 px-4 bg-background md:max-w-3xl md:mx-auto border-x border-b border-border">
            <Nav />
            <Separator
              orientation="vertical"
              className="h-4 my-auto md:flex hidden"
            />
            <ThemeToggle />
          </header>
          <ScrollArea className="w-full border-x h-[calc(100vh-3rem)] border-border bg-background bg-dots-border md:max-w-3xl md:mx-auto">
            <main className="min-h-full md:px-6">{children}</main>
            <footer className="border-border border-t md:px-6 px-4 py-6 bg-background">
              <Large>
                &copy; {new Date().getFullYear()} Dante Sparrås. All rights
              </Large>
            </footer>
          </ScrollArea>
        </Providers>
      </body>
    </html>
  );
}
