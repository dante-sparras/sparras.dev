"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/providers";
import { readCssTokens, type CssTokens } from "@/lib/theme";

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
