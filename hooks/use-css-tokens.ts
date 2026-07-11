"use client";

/**
 * Theme CSS tokens from the live document (`:root` / `.dark` in app/globals.css).
 *
 * Keep `CSS_TOKENS` in sync with custom properties on `:root` / `.dark`.
 * (Tailwind `@theme inline` only aliases those — we read the source vars.)
 */

import { useEffect, useState } from "react";
import { useTheme } from "@/components/providers";

export type ThemeMode = "light" | "dark";

/**
 * Every custom property set in `app/globals.css` on `:root` / `.dark`.
 * Order matches the stylesheet for easy diffing when tokens change.
 */
export const CSS_TOKENS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "radius",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const;

export type CssTokenName = (typeof CSS_TOKENS)[number];

export type CssTokens = Record<CssTokenName, string>;

function readCssTokens(root: Element = document.documentElement): CssTokens {
  const styles = getComputedStyle(root);
  const tokens = {} as CssTokens;
  for (const name of CSS_TOKENS) {
    tokens[name] = styles.getPropertyValue(`--${name}`).trim();
  }
  return tokens;
}

/**
 * All shadcn / globals.css design tokens; re-reads when the theme changes.
 *
 * @example
 * const tokens = useCssTokens();
 * if (!tokens) return null; // pre-hydration
 * tokens.primary; // e.g. "#e5e5e5"
 * tokens.radius;  // e.g. "0.875rem"
 */
export function useCssTokens(): CssTokens | null {
  const { resolvedTheme } = useTheme();
  const [tokens, setTokens] = useState<CssTokens | null>(null);

  useEffect(() => {
    setTokens(readCssTokens(document.documentElement));
  }, [resolvedTheme]);

  return tokens;
}
