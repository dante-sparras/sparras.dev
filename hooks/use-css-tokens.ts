"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/providers";
import {
  readCssTokens,
  readSurfaceTokens,
  THEME_COLOR_TOKENS,
  type ThemeColorName,
  type ThemeColorTokens,
  type ThemeSurfaceTokens,
} from "@/lib/theme";

/**
 * Live CSS color tokens; re-reads when the resolved theme changes.
 *
 * @example
 * const tokens = useCssTokens(); // all THEME_COLOR_TOKENS
 * const primary = tokens?.primary;
 *
 * const surface = useSurfaceTokens(); // background / foreground / muted / border
 */
export function useCssTokens(
  names: readonly ThemeColorName[] = THEME_COLOR_TOKENS,
): Partial<ThemeColorTokens> | null {
  const { resolvedTheme } = useTheme();
  const [tokens, setTokens] = useState<Partial<ThemeColorTokens> | null>(null);

  useEffect(() => {
    setTokens(readCssTokens(document.documentElement, names));
  }, [resolvedTheme, names]);

  return tokens;
}

/** Surface subset for canvases / WebGPU. */
export function useSurfaceTokens(): ThemeSurfaceTokens | null {
  const { resolvedTheme } = useTheme();
  const [tokens, setTokens] = useState<ThemeSurfaceTokens | null>(null);

  useEffect(() => {
    setTokens(readSurfaceTokens(document.documentElement));
  }, [resolvedTheme]);

  return tokens;
}
