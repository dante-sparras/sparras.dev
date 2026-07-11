/**
 * Simulation + color config (dgreenheck port, site-tuned).
 *
 * **Public surface:** only `BlackHoleOverrides` (stable knobs).
 * Full `BlackHoleConfig` is internal — used by mesh / uniforms / theme.
 * Theme tokens supply **colors only** — never non-color knobs.
 */
import type { ThemeMode, ThemeSurfaceTokens } from "@/lib/theme";

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
  /** Map CSS surface tokens → sim colors (requires `mode` + `tokens`). */
  themeColors?: boolean;
  mode?: ThemeMode;
  /** From `useSurfaceTokens()` / `readSurfaceTokens()` — no DOM reads here. */
  tokens?: ThemeSurfaceTokens | null;
};

// ── Defaults ────────────────────────────────────────────────────────────────

/** Site void — must stay #0a0a0a in dark (pixel-sample). */
const VOID = "#0a0a0a";

export const defaultBlackHoleConfig = {
  blackHoleMass: 0.4,
  gravitationalLensing: 2.95,
  dopplerStrength: 0.55,

  diskInnerRadius: 4.1,
  diskOuterRadius: 14.5,
  diskBrightness: 4.4,
  diskTemperature: 50,
  temperatureFalloff: 0.45,
  diskEdgeSoftnessInner: 0.55,
  diskEdgeSoftnessOuter: 0.75,
  diskSaturation: 1.0,

  turbulenceScale: 1.15,
  turbulenceStretch: 6.0,
  turbulenceSharpness: 1.25,
  diskRotationSpeed: -8.7,
  turbulenceCycleTime: 5,
  turbulenceLacunarity: 2.1,
  turbulencePersistence: 0.55,

  starsEnabled: true,
  starDensity: 0.1,
  starSize: 1.75,
  starBrightness: 0.1,

  nebulaEnabled: true,
  nebula1Scale: 2,
  nebula1Density: 0.5,
  nebula2Scale: 5.5,
  nebula2Density: 0.05,

  bloomStrength: 0.62,
  bloomRadius: 0.32,
  bloomThreshold: 0.36,

  stepSize: 0.75,
  diskInkMode: 0,

  starBackgroundColor: VOID,
  nebula1Color: "#000000",
  nebula2Color: "#121212",
  starTint: "#404040",
  diskTint: "#fafafa",
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

function colorsForTheme(
  mode: ThemeMode,
  tokens: ThemeSurfaceTokens,
): ThemeColors {
  const { background, muted, border, foreground } = tokens;

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

/**
 * Defaults + optional public overrides + optional theme colors.
 * Themed colors need `mode` + surface `tokens` (read outside this module).
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
