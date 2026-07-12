/**
 * Simulation + color config (dgreenheck port, site-tuned).
 *
 * **Public surface:** only `BlackHoleOverrides` (stable knobs).
 * Full `BlackHoleConfig` is internal — used by mesh / uniforms / theme.
 * Theme tokens supply **colors only** — never non-color knobs.
 */
import type { ResolvedTheme } from "@/components/providers";
import type { CssTokens } from "@/hooks";

// ── Internal full config ────────────────────────────────────────────────────

/** Full sim bag (internal). Prefer `BlackHoleOverrides` at call sites. */
export type BlackHoleConfig = {
  // Gravity
  blackHoleMass: number;
  gravitationalLensing: number;
  dopplerStrength: number;
  // Disk shape
  diskInnerRadius: number;
  diskOuterRadius: number;
  diskBrightness: number;
  diskTemperature: number;
  temperatureFalloff: number;
  diskEdgeSoftnessInner: number;
  diskEdgeSoftnessOuter: number;
  diskSaturation: number;
  /** Vertical scale height of the disk (volumetric half-thickness base). */
  diskScaleHeight: number;
  // Disk motion / noise
  turbulenceScale: number;
  turbulenceStretch: number;
  turbulenceSharpness: number;
  diskRotationSpeed: number;
  turbulenceCycleTime: number;
  turbulenceLacunarity: number;
  turbulencePersistence: number;
  // Stars
  starsEnabled: boolean;
  starDensity: number;
  starSize: number;
  starBrightness: number;
  // Nebula
  nebulaEnabled: boolean;
  nebula1Scale: number;
  nebula1Density: number;
  nebula2Scale: number;
  nebula2Density: number;
  // Post
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  // March
  stepSize: number;
  /** 0 = emissive, 1 = ink stamp (light theme). */
  diskInkMode: number;
  // Colors (hex; theme may override)
  starBackgroundColor: string;
  nebula1Color: string;
  nebula2Color: string;
  starTint: string;
  diskTint: string;
};

/**
 * Stable advanced knobs safe for callers to tweak.
 * Everything else stays on site defaults + theme.
 */
export type BlackHoleOverrides = Partial<
  Pick<
    BlackHoleConfig,
    | "diskBrightness"
    | "diskTemperature"
    | "temperatureFalloff"
    | "bloomStrength"
    | "bloomRadius"
    | "bloomThreshold"
    | "starsEnabled"
    | "nebulaEnabled"
    | "stepSize"
    | "gravitationalLensing"
    | "dopplerStrength"
  >
>;

export type BuildBlackHoleConfigOptions = {
  overrides?: BlackHoleOverrides;
  /** Map CSS design tokens → sim colors (requires `mode` + `tokens`). */
  themeColors?: boolean;
  mode?: ResolvedTheme;
  /** From `useCssTokens()` / `readCssTokens()` — no DOM reads here. */
  tokens?: CssTokens | null;
};

// ── Defaults ────────────────────────────────────────────────────────────────

/** Site void — dark `--background` in app/globals.css. */
const VOID = "#050505";

export const defaultBlackHoleConfig = {
  blackHoleMass: 0.48,
  gravitationalLensing: 4.8,
  dopplerStrength: 0.75,

  // Compact disk relative to a larger silhouette (fills banner like the refs)
  diskInnerRadius: 2.9,
  diskOuterRadius: 11.5,
  diskBrightness: 3.8,
  diskTemperature: 50,
  temperatureFalloff: 0.55,
  diskEdgeSoftnessInner: 0.28,
  diskEdgeSoftnessOuter: 0.82,
  diskSaturation: 1.0,
  // Thin through the void, thicker outer wings (not a fat fog, not a hairline)
  diskScaleHeight: 0.34,

  turbulenceScale: 2.0,
  turbulenceStretch: 17.0,
  turbulenceSharpness: 1.7,
  diskRotationSpeed: -9.2,
  turbulenceCycleTime: 7,
  turbulenceLacunarity: 2.25,
  turbulencePersistence: 0.48,

  starsEnabled: true,
  starDensity: 0.04,
  starSize: 1.25,
  starBrightness: 0.12,

  nebulaEnabled: false,
  nebula1Scale: 2,
  nebula1Density: 0.5,
  nebula2Scale: 5.5,
  nebula2Density: 0.05,

  bloomStrength: 0.62,
  bloomRadius: 0.32,
  bloomThreshold: 0.36,

  stepSize: 0.55,
  diskInkMode: 0,

  starBackgroundColor: VOID,
  nebula1Color: "#000000",
  nebula2Color: "#121212",
  starTint: "#b0b4c0",
  diskTint: "#ffd4b8",
} as const satisfies BlackHoleConfig;

// ── Theme colors ────────────────────────────────────────────────────────────

type ThemeColors = Pick<
  BlackHoleConfig,
  | "starBackgroundColor"
  | "nebula1Color"
  | "nebula2Color"
  | "starTint"
  | "diskTint"
>;

function colorsForTheme(mode: ResolvedTheme, tokens: CssTokens): ThemeColors {
  const background = tokens.background || VOID;
  const foreground = tokens.foreground || "#fafafa";
  const muted = tokens.muted || "#262626";
  const border = tokens.border || "#404040";
  const secondary = tokens.secondary || "#fafafa";

  if (mode === "light") {
    return {
      starBackgroundColor: background,
      nebula1Color: muted,
      nebula2Color: border,
      starTint: foreground,
      // Ink mode uses dark structure; keep warm-neutral disk stamp
      diskTint: muted,
    };
  }

  return {
    starBackgroundColor: background,
    nebula1Color: background,
    nebula2Color: secondary,
    starTint: border,
    // Keep peach artistic tint — pure foreground (#fafafa) washed the disk white
    diskTint: defaultBlackHoleConfig.diskTint,
  };
}

/**
 * Defaults + optional public overrides + optional theme colors.
 * Themed colors need `mode` + full CSS `tokens` (read outside this module).
 */
export function buildBlackHoleConfig(
  options: BuildBlackHoleConfigOptions = {},
): BlackHoleConfig {
  const { overrides, themeColors = false, mode, tokens } = options;
  const base: BlackHoleConfig = { ...defaultBlackHoleConfig, ...overrides };
  if (!themeColors || !mode || !tokens) return base;

  return {
    ...base,
    ...colorsForTheme(mode, tokens),
    diskInkMode: mode === "light" ? 1 : 0,
  };
}
