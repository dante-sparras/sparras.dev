/**
 * CSS design tokens from the live document (`:root` / `.dark`).
 *
 * React: `useTheme()` for mode; `useCssTokens()` when you need reactive colors.
 * Imperative (canvas / R3F): `readCssTokens()` once after mount.
 */

export type ThemeMode = "light" | "dark";

/** Semantic color vars we expose outside CSS (canvas, hooks, etc.). */
export const THEME_COLOR_TOKENS = [
  "background",
  "foreground",
  "muted",
  "muted-foreground",
  "border",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "accent",
  "accent-foreground",
  "card",
  "card-foreground",
  "destructive",
  "ring",
] as const;

export type ThemeColorName = (typeof THEME_COLOR_TOKENS)[number];

export type ThemeColorTokens = Record<ThemeColorName, string>;

/** Surface subset used by WebGPU / themed canvases. */
export type ThemeSurfaceTokens = Pick<
  ThemeColorTokens,
  "background" | "foreground" | "muted" | "border"
>;

const SURFACE_TOKENS = [
  "background",
  "foreground",
  "muted",
  "border",
] as const satisfies readonly ThemeColorName[];

/**
 * Read CSS custom properties with a single `getComputedStyle` pass.
 *
 * @example
 * const { primary, background } = readCssTokens();
 * // or: readCssTokens(document.documentElement, ["primary", "ring"])
 */
export function readCssTokens(
  root: Element = document.documentElement,
  names: readonly ThemeColorName[] = THEME_COLOR_TOKENS,
): Partial<ThemeColorTokens> & Record<string, string> {
  const styles = getComputedStyle(root);
  const tokens: Record<string, string> = {};
  for (const name of names) {
    tokens[name] = styles.getPropertyValue(`--${name}`).trim();
  }
  return tokens;
}

/** Surface tokens only (background / foreground / muted / border). */
export function readSurfaceTokens(
  root: Element = document.documentElement,
): ThemeSurfaceTokens {
  const t = readCssTokens(root, SURFACE_TOKENS);
  return {
    background: t.background || "#0a0a0a",
    foreground: t.foreground || "#fafafa",
    muted: t.muted || "#262626",
    border: t.border || "#404040",
  };
}
