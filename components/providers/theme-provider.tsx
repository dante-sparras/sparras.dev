"use client";

/**
 * Thin App Router wrapper around next-themes.
 * FOUC is handled by next-themes (no custom init script).
 */
import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/** User-selectable themes (stored preference). */
export const THEME_CHOICES = ["light", "dark", "system"] as const;
export type ThemeChoice = (typeof THEME_CHOICES)[number];

/** Applied document theme (`light` / `dark` class on <html>). */
export type ResolvedTheme = Exclude<ThemeChoice, "system">;

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
