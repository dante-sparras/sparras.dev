/**
 * Theme-aware **color** overrides for the black hole.
 * Tokens in app/globals.css are hex (optionally with alpha, e.g. #ffffff1a).
 * Non-color params live in defaults.ts.
 */

import { normalizeHex } from "@/lib/utils";
import type { BlackHoleColorConfig } from "./types";

/** Read a CSS custom property authored as hex (with optional alpha). */
export function readTokenHex(
  varName: string,
  scope: Element = document.documentElement,
): string | undefined {
  const raw = getComputedStyle(scope).getPropertyValue(varName).trim();
  return normalizeHex(raw);
}

/**
 * Color-only patch for the current site theme.
 * Colors may be `#rrggbb` or `#rrggbbaa`.
 */
export function getThemeBlackHolePatch(
  mode: "light" | "dark",
  scope: Element = document.documentElement,
): BlackHoleColorConfig {
  const background = readTokenHex("--background", scope)!;
  const muted = readTokenHex("--muted", scope)!;
  const border = readTokenHex("--border", scope)!;
  const foreground = readTokenHex("--foreground", scope)!;

  if (mode === "light") {
    return {
      starBackgroundColor: background,
      nebula1Color: muted,
      nebula2Color: border,
      starTint: foreground,
      diskTint: foreground,
    };
  }

  return {
    starBackgroundColor: background,
    nebula1Color: "#000000",
    nebula2Color: "#121212",
    starTint: border,
    diskTint: foreground,
  };
}
