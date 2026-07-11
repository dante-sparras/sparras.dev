import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GeistPixelSquare } from "geist/font/pixel";
import { headers } from "next/headers";
import "./globals.css";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/providers";
import { SITE_URL } from "@/lib/constants";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Stable prop for FOUC script (avoid re-creating object each render). */
const THEME_SCRIPT_PROP = { __html: THEME_INIT_SCRIPT } as const;

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const headerLocale = headersList.get("x-locale") ?? defaultLocale;
  const lang = isLocale(headerLocale) ? headerLocale : defaultLocale;

  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={cn(
        "h-full antialiased font-sans",
        geist.variable,
        geistMono.variable,
        GeistPixelSquare.variable,
      )}
    >
      <head>
        {/* FOUC guard — server-rendered, not a client-component <script> */}
        <script dangerouslySetInnerHTML={THEME_SCRIPT_PROP} />
      </head>
      <body className="flex min-h-svh flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
