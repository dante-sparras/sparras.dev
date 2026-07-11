/**
 * CSS design tokens from the live document (`:root` / `.dark` in app/globals.css).
 *
 * Keep `CSS_TOKENS` in sync with the custom properties set on `:root` / `.dark`.
 * (Tailwind `@theme inline` only aliases those — we read the source vars.)
 *
 * React: `useCssTokens()` · imperative: `readCssTokens()` after mount.
 */

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

/**
 * Read all design tokens with a single `getComputedStyle` pass.
 * Client-only — returns empty strings when `document` is unavailable.
 *
 * @example
 * const { primary, background, radius } = readCssTokens();
 */
export function readCssTokens(root?: Element | null): CssTokens {
  const empty = Object.fromEntries(CSS_TOKENS.map((n) => [n, ""])) as CssTokens;
  if (typeof document === "undefined") return empty;

  const styles = getComputedStyle(root ?? document.documentElement);
  const tokens = { ...empty };
  for (const name of CSS_TOKENS) {
    tokens[name] = styles.getPropertyValue(`--${name}`).trim();
  }
  return tokens;
}
