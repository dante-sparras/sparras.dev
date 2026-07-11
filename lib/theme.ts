/**
 * Theme helpers for class-based theme (`dark` / `light` on <html>).
 *
 * React: prefer `useTheme().resolvedTheme` + `themeModeFromResolved`.
 * Non-React: `readThemeMode` / `readCssHexToken` / `readThemeHexTokens`.
 */
import { normalizeHex } from "@/lib/utils";

export type ThemeMode = "light" | "dark";

/** Map `resolvedTheme` → mode (undefined until hydrated). */
export function themeModeFromResolved(
  resolvedTheme: string | undefined,
): ThemeMode | undefined {
  if (resolvedTheme === "dark" || resolvedTheme === "light") {
    return resolvedTheme;
  }
  return undefined;
}

function rootOf(root?: Element | null): Element {
  if (root) return root;
  if (typeof document !== "undefined") return document.documentElement;
  throw new Error("theme helpers need a DOM root (client-only)");
}

/** DOM fallback when `useTheme` is unavailable. */
export function readThemeMode(root?: Element | null): ThemeMode {
  return rootOf(root).classList.contains("dark") ? "dark" : "light";
}

/** Read a CSS variable as hex (`#rrggbb` / `#rrggbbaa`). */
export function readCssHexToken(
  varName: string,
  fallback: string,
  root?: Element | null,
): string {
  const name = varName.startsWith("--") ? varName : `--${varName}`;
  const raw = getComputedStyle(rootOf(root)).getPropertyValue(name).trim();
  return normalizeHex(raw) ?? normalizeHex(fallback) ?? fallback;
}

/** Common surface tokens used for themed WebGPU / canvas colors. */
export type ThemeHexTokens = {
  background: string;
  foreground: string;
  muted: string;
  border: string;
};

const FALLBACKS: ThemeHexTokens = {
  background: "#0a0a0a",
  foreground: "#fafafa",
  muted: "#262626",
  border: "#404040",
};

export function readThemeHexTokens(
  root?: Element | null,
  fallbacks: ThemeHexTokens = FALLBACKS,
): ThemeHexTokens {
  const scope = rootOf(root);
  return {
    background: readCssHexToken("--background", fallbacks.background, scope),
    foreground: readCssHexToken("--foreground", fallbacks.foreground, scope),
    muted: readCssHexToken("--muted", fallbacks.muted, scope),
    border: readCssHexToken("--border", fallbacks.border, scope),
  };
}
