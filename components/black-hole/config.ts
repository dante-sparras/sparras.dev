/**
 * Simulation + color config (Schwarzschild raymarch, site-tuned).
 *
 * **Public surface:** only `BlackHoleOverrides` (stable knobs).
 * Full `BlackHoleConfig` is internal — used by mesh / uniforms / theme.
 * Theme tokens supply **colors only** — never non-color knobs.
 *
 * Geometric units G = c = 1: Schwarzschild radius rs = 2M,
 * photon sphere = 1.5 rs, ISCO = 3 rs (6M).
 */
import type { ResolvedTheme } from "@/components/providers";
import type { CssTokens } from "@/hooks";

// ── Internal full config ────────────────────────────────────────────────────

/** Full sim bag (internal). Prefer `BlackHoleOverrides` at call sites. */
export type BlackHoleConfig = {
  // Gravity (M in geometric units; rs = 2M)
  blackHoleMass: number;
  /** Multiplier on the GR light-deflection term (~1.5 rs / r²). */
  gravitationalLensing: number;
  /** 0 = off, 1 = full special-relativistic beaming strength. */
  dopplerStrength: number;
  // Disk shape (cylindrical radii in same units as M)
  diskInnerRadius: number;
  diskOuterRadius: number;
  diskBrightness: number;
  /** Peak temperature in 1000 K units (50 → 50_000 K). */
  diskTemperature: number;
  /** T(r) ∝ (r_in / r)^α — thin-disk α ≈ 0.75. */
  temperatureFalloff: number;
  diskEdgeSoftnessInner: number;
  diskEdgeSoftnessOuter: number;
  diskSaturation: number;
  /** Vertical Gaussian scale height at mid-disk (world units). */
  diskScaleHeight: number;
  // Disk motion / noise
  turbulenceScale: number;
  /** Azimuthal stretch of FBM (>1 = long streamlines). */
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
  // March
  stepSize: number;
  /** 0 = emissive, 1 = ink stamp (light theme). */
  diskInkMode: number;
  // Colors (hex; theme may override)
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
    | "diskScaleHeight"
    | "diskInnerRadius"
    | "diskOuterRadius"
    | "starsEnabled"
    | "nebulaEnabled"
    | "stepSize"
    | "gravitationalLensing"
    | "dopplerStrength"
    | "blackHoleMass"
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

/**
 * Physical-ish banner defaults (M = 0.5 → rs = 1):
 * photon sphere 1.5, ISCO 3, disk from ~ISCO out to ~16.
 */
export const defaultBlackHoleConfig = {
  blackHoleMass: 0.5,
  gravitationalLensing: 1.15,
  dopplerStrength: 0.9,

  diskInnerRadius: 3.4,
  diskOuterRadius: 16.0,
  diskBrightness: 3.6,
  diskTemperature: 48,
  temperatureFalloff: 0.75,
  diskEdgeSoftnessInner: 0.28,
  diskEdgeSoftnessOuter: 0.88,
  diskSaturation: 0.9,
  diskScaleHeight: 0.26,

  turbulenceScale: 1.75,
  turbulenceStretch: 14.0,
  turbulenceSharpness: 1.45,
  diskRotationSpeed: -8.5,
  turbulenceCycleTime: 6.5,
  turbulenceLacunarity: 2.2,
  turbulencePersistence: 0.5,

  starsEnabled: true,
  starDensity: 0.04,
  starSize: 1.25,
  starBrightness: 0.12,

  nebulaEnabled: false,
  nebula1Scale: 2,
  nebula1Density: 0.35,
  nebula2Scale: 5.5,
  nebula2Density: 0.08,

  stepSize: 0.55,
  diskInkMode: 0,

  nebula1Color: "#1a1020",
  nebula2Color: "#120a18",
  starTint: "#b0b4c0",
  diskTint: "#ffd4b8",
} as const satisfies BlackHoleConfig;

// ── Theme colors ────────────────────────────────────────────────────────────

type ThemeColors = Pick<
  BlackHoleConfig,
  "nebula1Color" | "nebula2Color" | "starTint" | "diskTint"
>;

function colorsForTheme(mode: ResolvedTheme, tokens: CssTokens): ThemeColors {
  const background = tokens.background || VOID;
  const foreground = tokens.foreground || "#fafafa";
  const muted = tokens.muted || "#262626";
  const border = tokens.border || "#404040";
  const secondary = tokens.secondary || "#fafafa";

  if (mode === "light") {
    return {
      nebula1Color: muted,
      nebula2Color: border,
      starTint: foreground,
      diskTint: muted,
    };
  }

  return {
    nebula1Color: background,
    nebula2Color: secondary,
    starTint: border,
    // Keep warm artistic disk tint — pure foreground washed the disk white
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
