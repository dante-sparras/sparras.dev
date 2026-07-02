import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sparras.dev"),
  title: {
    default: "Dante Sparrås",
    template: "%s · Dante Sparrås",
  },
  description:
    "Portfolio of Dante Sparrås — full-stack and game developer focused on clean architecture, modular systems, and strong DX and UX. Web with Next.js, games, and .NET.",
  applicationName: "sparras.dev",
  authors: [{ name: "Dante Sparrås", url: "https://sparras.dev" }],
  creator: "Dante Sparrås",
  keywords: [
    "Dante Sparrås",
    "full-stack developer",
    "game developer",
    "Next.js",
    "portfolio",
    "Norrköping",
    "Sweden",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "sparras.dev",
    title: "Dante Sparrås",
    description:
      "Full-stack and game developer portfolio — web, games, and thoughtful system design.",
  },
  twitter: {
    card: "summary",
    title: "Dante Sparrås",
    description:
      "Full-stack and game developer portfolio — web, games, and thoughtful system design.",
    creator: "@DanteSparras",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased font-sans",
        geistSans.variable,
        geistMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
