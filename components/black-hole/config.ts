/**
 * Simulation + color config (Schwarzschild raymarch, site-tuned).
 *
 * Structure follows dgreenheck/webgpu-black-hole knobs, with a small public
 * `BlackHoleOverrides` surface and theme color mapping only.
 *
 * Geometric units G = c = 1: rs = 2M, photon sphere = 3M, ISCO = 6M.
 */

import type { ResolvedTheme } from "@/components/providers";
import type { CssTokens } from "@/hooks";

// ── Types ───────────────────────────────────────────────────────────────────

/** Full sim bag (internal). Prefer `BlackHoleOverrides` at call sites. */
export type BlackHoleConfig = {
  blackHoleMass: number;
  /** Scales affine step (1 = geometric units). */
  gravitationalLensing: number;
  dopplerStrength: number;

  diskInnerRadius: number;
  diskOuterRadius: number;
  diskBrightness: number;
  /** Peak T in 1000 K (50 → 50_000 K). */
  diskTemperature: number;
  /** T(r) ∝ (r_in/r)^α — thin disk α ≈ 0.75. */
  temperatureFalloff: number;
  diskEdgeSoftnessInner: number;
  diskEdgeSoftnessOuter: number;
  diskSaturation: number;
  /** Gaussian scale height at midplane (world units). */
  diskScaleHeight: number;

  turbulenceScale: number;
  turbulenceStretch: number;
  turbulenceSharpness: number;
  diskRotationSpeed: number;
  turbulenceCycleTime: number;
  turbulenceLacunarity: number;
  turbulencePersistence: number;

  starsEnabled: boolean;
  starDensity: number;
  starSize: number;
  starBrightness: number;

  nebulaEnabled: boolean;
  nebula1Scale: number;
  nebula1Density: number;
  nebula2Scale: number;
  nebula2Density: number;

  stepSize: number;
  /** 0 = emissive, 1 = ink (light theme). */
  diskInkMode: number;

  nebula1Color: string;
  nebula2Color: string;
  starTint: string;
  diskTint: string;
};

/** Stable knobs callers may override. */
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
  themeColors?: boolean;
  mode?: ResolvedTheme;
  tokens?: CssTokens | null;
};

// ── Defaults ────────────────────────────────────────────────────────────────

const VOID = "#050505";

/**
 * Defaults lean on dgreenheck’s demo knobs, retuned for the profile banner:
 * steep T falloff → peach outer arms (not white plate), FOV framing, no bloom.
 */
export const defaultBlackHoleConfig = {
  blackHoleMass: 0.45,
  // Tutorial bend scale (his demo uses ~2.4 with stepSize 1)
  gravitationalLensing: 2.2,
  dopplerStrength: 1.2,

  diskInnerRadius: 3.4,
  diskOuterRadius: 17.0,
  diskBrightness: 7.0,
  diskTemperature: 38,
  temperatureFalloff: 3.6,
  diskEdgeSoftnessInner: 0.12,
  diskEdgeSoftnessOuter: 0.75,
  diskSaturation: 1.12,
  diskScaleHeight: 0.26,

  // Always-cloudy: denser fill + more chaotic packs
  turbulenceScale: 1.75,
  turbulenceStretch: 2.2,
  turbulenceSharpness: 2.1,
  diskRotationSpeed: -12.0,
  turbulenceCycleTime: 5.0,
  turbulenceLacunarity: 2.5,
  turbulencePersistence: 0.52,

  starsEnabled: true,
  starDensity: 0.12,
  starSize: 1.35,
  starBrightness: 0.2,

  nebulaEnabled: false,
  nebula1Scale: 2,
  nebula1Density: 0.3,
  nebula2Scale: 5.5,
  nebula2Density: 0.06,

  stepSize: 0.5,
  diskInkMode: 0,

  nebula1Color: "#1a1020",
  nebula2Color: "#120a18",
  starTint: "#b0b4c0",
  diskTint: "#ffc4a0",
} as const satisfies BlackHoleConfig;

// ── Theme ───────────────────────────────────────────────────────────────────

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
    // Keep warm peach — pure foreground washes the disk white
    diskTint: defaultBlackHoleConfig.diskTint,
  };
}

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
