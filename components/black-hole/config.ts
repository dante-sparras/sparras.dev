/**
 * Binary black-hole configuration.
 *
 * ## Units
 * Geometric units throughout: **G = c = 1**. A mass **M** also sets the length
 * and time scale (r_s = 2M for Schwarzschild).
 *
 * ## Layers
 * 1. {@link BlackHoleOverrides} / {@link defaultPhysics} — **raw** knobs only
 * 2. {@link BlackHoleConfig} — resolved masses, Kerr scales, Kepler Ω, render
 * 3. {@link defaultRender} — pixel-art only (not public overrides)
 *
 * **Public knobs are raw only** (M, q, d, χ, i, D, H/R, T_peak, α, Ṁ).
 * Derived quantities (r₊, ISCO, photon sphere, a, Ω, absolute H, …) are
 * computed by {@link buildBlackHoleConfig} and are never user overrides.
 *
 * Kerr helpers live in `./kerr` and are re-exported here.
 *
 * @module components/black-hole/config
 */

import type { ResolvedTheme } from "@/components/providers";
import { binaryOrbitalOmega } from "./binary";
import { clampSpin, kerrScales } from "./kerr";

export type { KerrScales } from "./kerr";
export {
  clampSpin,
  iscoRadius,
  keplerOmega,
  kerrScales,
  photonSphereRadius,
} from "./kerr";

/**
 * Clamp observer inclination in **degrees** from the orbital / disk normal.
 * Full hemisphere range:
 * - `0`   — face-on looking down +Y
 * - `90`  — edge-on (orbital plane)
 * - `180` — face-on looking up from −Y
 * Values like `135` sit 45° past edge-on (southern / “under” view).
 */
export function clampInclinationDegrees(inclination: number): number {
  if (!Number.isFinite(inclination)) return 62;
  return Math.min(180, Math.max(0, inclination));
}

/** Vertical FOV used by the host canvas and shader ray basis. */
export const CAMERA_FOV_DEG = 48;

/** Orbit zoom limits from observer distance D. */
export function orbitDistanceLimits(cameraDistance: number): {
  min: number;
  max: number;
} {
  const d = Math.max(8, cameraDistance);
  return {
    min: Math.max(4, d * 0.45),
    max: d * 2.8,
  };
}

/**
 * Inverted skydome radius — must stay larger than orbit max zoom so the
 * camera never leaves the raymarch shell.
 */
export function skyDomeRadius(orbitMaxDistance: number): number {
  return Math.max(80, orbitMaxDistance * 1.2);
}

// ── Public physics surface ──────────────────────────────────────────────────

/**
 * User-editable **raw** physics and observer parameters.
 *
 * Every field is optional; omitted keys fall back to {@link defaultPhysics}.
 * Do **not** put derived scales (r₊, ISCO, Ω, absolute H, …) or pixel-art
 * fudge factors here — those come from {@link buildBlackHoleConfig} /
 * {@link defaultRender}.
 */
export type BlackHoleOverrides = Partial<{
  /**
   * Primary black-hole mass **M₁** (geometric units).
   * Sets the length scale of the primary and its mini-disk.
   * @defaultValue 0.5
   */
  primaryMass: number;

  /**
   * Mass ratio **q = M₂ / M₁** (raw). Secondary mass is derived as M₁·q.
   * Clamped to about `[0.15, 4]` when building the config.
   * @defaultValue 1
   */
  massRatio: number;

  /**
   * Center-to-center orbital separation **d** (geometric units).
   *
   * Derived: r₁ = d·M₂/M_tot, r₂ = d·M₁/M_tot, Ω = √(M_tot/d³).
   * Camera only pulls back if both holes would leave the FOV.
   * @defaultValue 12
   */
  separation: number;

  /**
   * Dimensionless spin **χ = a / M**, applied to **both** holes (`|χ| < 1`).
   * Derives r₊, photon sphere, ISCO on the CPU; GPU uses χ in local Kerr
   * null deflection and disk orbital velocity (Doppler).
   * @defaultValue 0.35
   */
  spin: number;

  /**
   * Observer inclination **i** in **degrees** from the orbital / disk normal.
   * Full range **0–180**:
   * - `0` = face-on (looking down +Y)
   * - `90` = edge-on
   * - `135` = 45° past edge-on (slight underside / southern view)
   * - `180` = face-on from below (−Y)
   * @defaultValue 62
   */
  inclination: number;

  /**
   * Observer distance **D** from the system barycenter (geometric units).
   * Respected as a raw knob (clamped to a small minimum). Not auto-scaled
   * proportionally with separation — change D here to zoom the system.
   * @defaultValue 28
   */
  cameraDistance: number;

  /**
   * Mini-disk outer radius in units of **each hole’s own mass**:
   * `r_out = diskOuterRadiusM × Mᵢ` (raw). Inner edge = prograde ISCO (derived).
   * @defaultValue 12
   */
  diskOuterRadiusM: number;

  /**
   * Disk aspect ratio **H / R** (raw). Absolute scale height is derived.
   * @defaultValue 0.06
   */
  diskAspectRatio: number;

  /**
   * Peak effective temperature near the ISCO, in units of **1000 K** (raw).
   * Example: `48` → T_peak = 48 000 K.
   *
   * Drives thin-disk **T(r)** and **temperature→peach RGB** (plus Doppler-shifted T).
   * Try ±15 for visible shifts; never produces pure white.
   * @defaultValue 48
   */
  peakTemperature: number;

  /**
   * Radial temperature index **α** in **T ∝ r^{−α}** (raw).
   * Shakura–Sunyaev / multi-temperature thin disk: **α ≈ 0.75**.
   * @defaultValue 0.75
   */
  temperatureIndex: number;

  /**
   * Relative accretion rate / surface emissivity (∝ **Ṁ**, raw).
   * Primary brightness control. Does not change geometry.
   * @defaultValue 8.5
   */
  accretionRate: number;
}>;

/** Alias: fully specified raw physics surface (all overrides required). */
export type RawBlackHolePhysics = Required<BlackHoleOverrides>;

// ── Resolved config (mesh + host) ───────────────────────────────────────────

/**
 * Fully resolved simulation state after clamps, Kerr scales, and Kepler Ω.
 * Built by {@link buildBlackHoleConfig}; consumed by mesh uniforms and the R3F host.
 */
export type BlackHoleConfig = {
  // ── Masses & orbit ──────────────────────────────────────────────────────
  /** Primary mass M₁ (clamped). */
  primaryMass: number;
  /** Secondary mass M₂ = q M₁. */
  secondaryMass: number;
  /** Total mass M_tot = M₁ + M₂. */
  totalMass: number;
  /** Mass ratio q = M₂ / M₁. */
  massRatio: number;
  /** Orbital separation d (center-to-center). */
  separation: number;
  /**
   * Binary orbital angular frequency **Ω = √(M_tot / d³)**
   * (circular two-body mean motion, geometric units).
   */
  orbitalFrequency: number;

  // ── Spin & Kerr scales ──────────────────────────────────────────────────
  /** Dimensionless spin χ. */
  spin: number;
  /** Dimensional spin of the primary a = χ M₁. */
  spinParameter: number;
  /** Outer event horizon r₊ of the primary. */
  eventHorizonPrimary: number;
  /** Outer event horizon r₊ of the secondary. */
  eventHorizonSecondary: number;
  /** Equatorial co-rotating photon-sphere radius — primary. */
  photonSpherePrimary: number;
  /** Equatorial co-rotating photon-sphere radius — secondary. */
  photonSphereSecondary: number;
  /** Prograde (co-rotating) ISCO radius — primary. */
  iscoPrimary: number;
  /** Prograde (co-rotating) ISCO radius — secondary. */
  iscoSecondary: number;

  // ── Observer ────────────────────────────────────────────────────────────
  /** Inclination i in degrees. */
  inclination: number;
  /** Observer distance D (may be FOV-adjusted). */
  cameraDistance: number;

  // ── Disk ────────────────────────────────────────────────────────────────
  /** Outer radius factor r_out / Mᵢ. */
  diskOuterRadiusM: number;
  /** Aspect ratio H/R. */
  diskAspectRatio: number;
  /**
   * Primary mini-disk vertical scale height (geometric units),
   * ≈ (H/R) × characteristic mid-disk radius of hole 1.
   */
  diskScaleHeightPrimary: number;
  /**
   * Secondary mini-disk vertical scale height (geometric units),
   * ≈ (H/R) × characteristic mid-disk radius of hole 2.
   */
  diskScaleHeightSecondary: number;
  /** T_peak in 1000 K units. */
  peakTemperature: number;
  /** Temperature index α. */
  temperatureIndex: number;
  /** ∝ Ṁ emissivity (may be dimmed in light theme). */
  accretionRate: number;

  // ── Render (from defaultRender; not physics overrides) ──────────────────
  /** Base raymarch step size. */
  stepSize: number;
  /** Pixel-art cell size in framebuffer pixels. */
  pixelSize: number;
  /** Bayer ordered-dither strength ∈ [0, 1]. */
  ditherStrength: number;
  /** Color quantization levels. */
  colorLevels: number;
};

/** Options for {@link buildBlackHoleConfig}. */
export type BuildBlackHoleConfigOptions = {
  /** Partial physics overrides merged onto {@link defaultPhysics}. */
  overrides?: BlackHoleOverrides;
  /**
   * When true and `mode === "light"`, scales down `accretionRate` so the
   * banner does not blow out on light backgrounds.
   */
  themeColors?: boolean;
  /** Resolved color scheme from `next-themes`. */
  mode?: ResolvedTheme;
};

// ── Defaults ────────────────────────────────────────────────────────────────

/**
 * Site physics defaults for the hero banner.
 *
 * Prefer tuning {@link BlackHoleOverrides.peakTemperature} (hue bias) and
 * {@link BlackHoleOverrides.accretionRate} (brightness) first; then
 * {@link BlackHoleOverrides.separation} for binary spacing.
 */
export const defaultPhysics = {
  primaryMass: 0.5,
  massRatio: 1.5,
  separation: 20,
  spin: 0.5,
  inclination: 135,
  cameraDistance: 30,
  diskOuterRadiusM: 15,
  diskAspectRatio: 0.05,
  peakTemperature: 50,
  temperatureIndex: 1,
  accretionRate: 5,
} as const satisfies Required<BlackHoleOverrides>;

/**
 * Numerical / pixel-art presentation parameters.
 * Intentionally **not** on the public override surface.
 */
export const defaultRender = {
  /** Base raymarch step (smaller → sharper near horizons, costlier). */
  stepSize: 0.5,
  /** Pixel cell size (larger → chunkier pixel art, cheaper). */
  pixelSize: 2,
  /** Ordered dither amount after quantize. */
  ditherStrength: 0.3,
  /** Quantization ladder for the pixel grade. */
  colorLevels: 16,
} as const;

// ── Build helpers ───────────────────────────────────────────────────────────

function mergePhysics(
  base: typeof defaultPhysics,
  overrides: BlackHoleOverrides,
): Required<BlackHoleOverrides> {
  return { ...base, ...overrides };
}

/**
 * World-space camera position looking at the origin.
 *
 * Disk / orbital plane is **XZ**. Inclination degrees from +Y:
 * - `0` → +Y (face-on)
 * - `90` → edge-on
 * - `180` → −Y (face-on from below)
 *
 * A small azimuthal offset avoids a perfectly edge-symmetric view.
 *
 * @param inclination - Degrees from the orbital normal (0–180)
 * @param cameraDistance - Distance from the barycenter
 */
export function cameraPositionFromObserver(
  inclination: number,
  cameraDistance: number,
): [number, number, number] {
  const inclinationRadians =
    (clampInclinationDegrees(inclination) * Math.PI) / 180;
  const distance = Math.max(8, cameraDistance);
  // Slight azimuthal offset — not a free art knob; keeps edge-on view asymmetric
  const azimuthBias = 0.12;
  const sinI = Math.sin(inclinationRadians);
  const cosI = Math.cos(inclinationRadians);
  const x = distance * sinI * azimuthBias;
  const y = distance * cosI;
  const z = distance * sinI;
  return [x, y, z];
}

/** Mid-disk characteristic radius for scale-height: ½ (ISCO + r_out). */
function characteristicDiskRadius(
  isco: number,
  mass: number,
  diskOuterRadiusM: number,
): number {
  return 0.5 * (isco + diskOuterRadiusM * mass);
}

function scaleHeightFromAspect(
  aspect: number,
  isco: number,
  mass: number,
  diskOuterRadiusM: number,
): number {
  return Math.max(
    0.05,
    aspect * characteristicDiskRadius(isco, mass, diskOuterRadiusM),
  );
}

/**
 * Per-hole resolved scales used while building config.
 * Flattened to Primary/Secondary fields for the GPU uniform bag.
 */
type ResolvedHole = {
  mass: number;
  eventHorizon: number;
  photonSphere: number;
  isco: number;
  diskScaleHeight: number;
  /** Dimensional spin a = χ M (primary only needed on public config today). */
  a: number;
};

function resolveHole(
  mass: number,
  spin: number,
  diskAspectRatio: number,
  diskOuterRadiusM: number,
): ResolvedHole {
  const scales = kerrScales(mass, spin);
  return {
    mass: scales.mass,
    eventHorizon: scales.eventHorizon,
    photonSphere: scales.photonSphere,
    isco: scales.iscoPrograde,
    diskScaleHeight: scaleHeightFromAspect(
      diskAspectRatio,
      scales.iscoPrograde,
      scales.mass,
      diskOuterRadiusM,
    ),
    a: scales.a,
  };
}

/**
 * Merge overrides, clamp physical ranges, derive Kerr scales and Kepler Ω.
 *
 * @returns A complete {@link BlackHoleConfig} ready for the mesh uniform bag
 */
export function buildBlackHoleConfig(
  options: BuildBlackHoleConfigOptions = {},
): BlackHoleConfig {
  const { overrides = {}, themeColors = false, mode } = options;
  const physics = mergePhysics(defaultPhysics, overrides);

  const primaryMass = Math.max(0.08, physics.primaryMass);
  const massRatio = Math.min(4, Math.max(0.15, physics.massRatio));
  const secondaryMass = primaryMass * massRatio;
  const totalMass = primaryMass + secondaryMass;
  const separation = Math.max(2.5, physics.separation);
  const spin = clampSpin(physics.spin);
  const inclination = clampInclinationDegrees(physics.inclination);
  const diskOuterRadiusM = Math.max(3, physics.diskOuterRadiusM);
  const diskAspectRatio = Math.min(
    0.25,
    Math.max(0.005, physics.diskAspectRatio),
  );
  const peakTemperature = Math.max(1, physics.peakTemperature);
  const temperatureIndex = Math.min(
    1.5,
    Math.max(0.5, physics.temperatureIndex),
  );
  let accretionRate = Math.max(0.1, physics.accretionRate);

  // Raw cameraDistance: respect user/default value (only floor for stability).
  // Never force D ∝ separation — that made cameraDistance look broken.
  const cameraDistance = Math.max(8, physics.cameraDistance);

  const [primary, secondary] = [
    resolveHole(primaryMass, spin, diskAspectRatio, diskOuterRadiusM),
    resolveHole(secondaryMass, spin, diskAspectRatio, diskOuterRadiusM),
  ];

  /** Circular two-body mean motion Ω = √(M / d³) (Newtonian CM; not keplerOmega). */
  const orbitalFrequency = binaryOrbitalOmega(totalMass, separation);

  // Light theme: dim emissivity so fire doesn't blow out on pale page bg
  if (themeColors && mode === "light") {
    accretionRate *= 0.55;
  }

  return {
    primaryMass: primary.mass,
    secondaryMass: secondary.mass,
    totalMass,
    massRatio,
    separation,
    orbitalFrequency,
    spin,
    /** Primary a = χ M₁ (CPU-only; light bend is Schwarzschild). */
    spinParameter: primary.a,
    eventHorizonPrimary: primary.eventHorizon,
    eventHorizonSecondary: secondary.eventHorizon,
    photonSpherePrimary: primary.photonSphere,
    photonSphereSecondary: secondary.photonSphere,
    iscoPrimary: primary.isco,
    iscoSecondary: secondary.isco,

    inclination,
    cameraDistance,

    diskOuterRadiusM,
    diskAspectRatio,
    diskScaleHeightPrimary: primary.diskScaleHeight,
    diskScaleHeightSecondary: secondary.diskScaleHeight,
    peakTemperature,
    temperatureIndex,
    accretionRate,

    stepSize: defaultRender.stepSize,
    pixelSize: defaultRender.pixelSize,
    ditherStrength: defaultRender.ditherStrength,
    colorLevels: defaultRender.colorLevels,
  };
}
