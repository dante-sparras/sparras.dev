/**
 * Binary black-hole configuration.
 *
 * ## Units
 * Geometric units throughout: **G = c = 1**. Masses are **not** solar masses.
 * A mass **M** also sets the length and time scale (Schwarzschild radius
 * r_s = 2M). So `primaryMass: 0.5` means “half a geometric mass unit,” not 0.5 M☉.
 * Lengths (separation, cameraDistance, horizons) share that same unit system.
 *
 * ## Layers
 * 1. {@link PhysicsParams} / {@link defaultPhysics} — **raw** knobs only
 * 2. {@link BlackHoleConfig} — resolved masses, Kerr scales, Kepler Ω, render
 * 3. {@link defaultRender} — pixel-art only (not public knobs)
 *
 * ## Configure (partial only — flat knobs)
 * ```ts
 * buildBlackHoleConfig({ primaryMass: 0.5, secondaryMass: 0.75 })
 * <BlackHole primaryMass={0.5} secondaryMass={0.75} spin={0.8} />
 * ```
 *
 * Public knobs are raw only. Derived scales are never user inputs.
 *
 * @module components/black-hole/physics/config
 */

import { binaryOrbitalOmega } from "./binary";
import { clampSpin, kerrScales } from "./kerr";
import { PHYSICS_LIMITS } from "./limits";
import { clampInclinationDegrees } from "./observer";

export type { KerrScales } from "./kerr";
export {
  CAMERA,
  DOPPLER_LIMITS,
  PALETTE_LIMITS,
  PHYSICS_LIMITS,
  SPIN_LIMITS,
} from "./limits";
export {
  binaryVisualExtent,
  cameraPositionFromObserver,
  clampInclinationDegrees,
  orbitDistanceLimits,
  skyDomeRadius,
} from "./observer";

// ── Public physics surface ──────────────────────────────────────────────────

/**
 * Canonical list of raw physics knobs.
 * @see {@link PhysicsParams}
 */
export const RAW_PHYSICS_KEYS = [
  "primaryMass",
  "secondaryMass",
  "separation",
  "spin",
  "inclination",
  "cameraDistance",
  "diskOuterRadiusM",
  "diskAspectRatio",
  "peakTemperature",
  "temperatureIndex",
  "accretionRate",
] as const;

/** One raw public physics key. */
export type RawPhysicsKey = (typeof RAW_PHYSICS_KEYS)[number];

/**
 * User-editable **raw** physics and observer parameters.
 * Every field is optional; omitted keys fall back to {@link defaultPhysics}.
 */
export type PhysicsParams = Partial<{
  /**
   * Primary mass **M₁** in **geometric units** (G = c = 1) — **not** solar masses.
   * Sets the primary’s length scale (r₊ ≈ M…2M). Larger → bigger hole + stronger lensing.
   * - Clamped ≥ {@link PHYSICS_LIMITS.massMin}
   * @defaultValue 0.5
   */
  primaryMass: number;

  /**
   * Secondary mass **M₂** in **geometric units** (G = c = 1) — **not** solar masses.
   * Independent of M₁ (unlike the old mass ratio). Larger → bigger secondary.
   * - Clamped ≥ {@link PHYSICS_LIMITS.massMin}
   * @defaultValue 0.75
   */
  secondaryMass: number;

  /**
   * Center-to-center separation **d**.
   * - Lower → tighter/faster binary · Higher → wider/slower
   * - Does not force cameraDistance · Clamped ≥ {@link PHYSICS_LIMITS.separationMin}
   * @defaultValue 20
   */
  separation: number;

  /**
   * Dimensionless spin **χ = a/M** (both holes).
   * - ~0 Schwarzschild · higher |χ| smaller prograde ISCO + more frame-drag
   * @defaultValue 0.5
   */
  spin: number;

  /**
   * Inclination **i** degrees from disk normal (0–180).
   * - 0 face-on +Y · 90 edge-on · 135 underside · 180 face-on −Y
   * @defaultValue 98
   */
  inclination: number;

  /**
   * Observer distance **D** (zoom). Independent of separation.
   * - Lower closer · Higher smaller on screen · Clamped ≥ {@link PHYSICS_LIMITS.cameraDistanceMin}
   * @defaultValue 30
   */
  cameraDistance: number;

  /**
   * Mini-disk outer radius in units of each hole’s mass: r_out = factor × Mᵢ.
   * - Lower compact rings · Higher extended plates · Clamped ≥ {@link PHYSICS_LIMITS.diskOuterRadiusMMin}
   * @defaultValue 15
   */
  diskOuterRadiusM: number;

  /**
   * Disk aspect ratio **H/R**.
   * - Lower razor-thin · Higher puffy · Clamped to aspect range in PHYSICS_LIMITS
   * @defaultValue 0.05
   */
  diskAspectRatio: number;

  /**
   * Peak T near ISCO in **1000 K** units (e.g. 50 → 50_000 K).
   * - Lower cooler/redder · Higher hotter peach · Never pure white
   * @defaultValue 50
   */
  peakTemperature: number;

  /**
   * Radial temperature index **α** in T ∝ r^{−α} (≈0.75 Shakura–Sunyaev).
   * - Lower flatter T · Higher steeper falloff
   * @defaultValue 1
   */
  temperatureIndex: number;

  /**
   * Relative accretion / emissivity ∝ **Ṁ** (brightness only, not geometry).
   * - Lower dimmer · Higher brighter
   * @defaultValue 5
   */
  accretionRate: number;
}>;

/** Fully specified raw physics surface. */
export type RawPhysics = Required<PhysicsParams>;

/**
 * Pick finite raw physics numbers from one or more loose objects (later wins).
 */
export function pickPhysics(
  ...sources: Array<Partial<Record<RawPhysicsKey, unknown>> | null | undefined>
): PhysicsParams {
  const out: PhysicsParams = {};
  for (const source of sources) {
    if (!source) continue;
    for (const key of RAW_PHYSICS_KEYS) {
      const value = source[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        out[key] = value;
      }
    }
  }
  return out;
}

/** Defaults + partial (no Kerr derivation). */
export function resolvePhysics(partial: PhysicsParams = {}): RawPhysics {
  return { ...defaultPhysics, ...pickPhysics(partial) };
}

// ── Resolved config ─────────────────────────────────────────────────────────

/**
 * Fully resolved simulation state after clamps, Kerr scales, and Kepler Ω.
 */
export type BlackHoleConfig = {
  primaryMass: number;
  secondaryMass: number;
  totalMass: number;
  /** Derived convenience: q = M₂ / M₁ (not a public knob). */
  massRatio: number;
  separation: number;
  /** Ω = √(M_tot / d³) */
  orbitalFrequency: number;

  spin: number;
  /** Primary dimensional spin a = χ M₁ */
  primarySpinA: number;
  eventHorizonPrimary: number;
  eventHorizonSecondary: number;
  photonSpherePrimary: number;
  photonSphereSecondary: number;
  iscoPrimary: number;
  iscoSecondary: number;

  inclination: number;
  cameraDistance: number;

  diskOuterRadiusM: number;
  diskAspectRatio: number;
  diskScaleHeightPrimary: number;
  diskScaleHeightSecondary: number;
  peakTemperature: number;
  temperatureIndex: number;
  accretionRate: number;

  stepSize: number;
  pixelSize: number;
  ditherStrength: number;
  colorLevels: number;
};

// ── Defaults ────────────────────────────────────────────────────────────────

/**
 * Site physics defaults for the hero banner.
 * Edit here for production look, or pass partials at call sites.
 *
 * Masses are geometric (G=c=1), not solar masses. Defaults match the old
 * M₁=0.5, q=1.5 → M₂=0.75 look.
 */
export const defaultPhysics = {
  primaryMass: 0.5,
  secondaryMass: 0.75,
  separation: 20,
  spin: 0.5,
  inclination: 98,
  cameraDistance: 30,
  diskOuterRadiusM: 15,
  diskAspectRatio: 0.05,
  peakTemperature: 50,
  temperatureIndex: 1,
  accretionRate: 5,
} as const satisfies RawPhysics;

/** Pixel-art / march presentation (not public knobs). */
export const defaultRender = {
  /** Base raymarch step — lower sharper/costlier. */
  stepSize: 0.5,
  /** Pixel cell size (with host DPR). */
  pixelSize: 2,
  /** Ordered dither after quantize ∈ [0,1]. */
  ditherStrength: 0.3,
  /** Quantization ladder. */
  colorLevels: 16,
} as const;

// ── Build ───────────────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi = Number.POSITIVE_INFINITY): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

function scaleHeightFromAspect(
  aspect: number,
  isco: number,
  mass: number,
  diskOuterRadiusM: number,
): number {
  const charR = 0.5 * (isco + diskOuterRadiusM * mass);
  return Math.max(PHYSICS_LIMITS.scaleHeightFloor, aspect * charR);
}

function resolveHole(
  mass: number,
  spin: number,
  diskAspectRatio: number,
  diskOuterRadiusM: number,
) {
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
 * Pure resolve: merge knobs → clamps → Kerr scales → Ω.
 */
export function buildBlackHoleConfig(
  partial: PhysicsParams = {},
): BlackHoleConfig {
  const p = resolvePhysics(partial);
  const L = PHYSICS_LIMITS;

  const primaryMass = clamp(p.primaryMass, L.massMin);
  const secondaryMass = clamp(p.secondaryMass, L.massMin);
  const totalMass = primaryMass + secondaryMass;
  const massRatio = secondaryMass / primaryMass;
  const separation = clamp(p.separation, L.separationMin);
  const spin = clampSpin(p.spin);
  const inclination = clampInclinationDegrees(p.inclination);
  const diskOuterRadiusM = clamp(p.diskOuterRadiusM, L.diskOuterRadiusMMin);
  const diskAspectRatio = clamp(
    p.diskAspectRatio,
    L.diskAspectMin,
    L.diskAspectMax,
  );
  const peakTemperature = clamp(p.peakTemperature, L.peakTemperatureMin);
  const temperatureIndex = clamp(
    p.temperatureIndex,
    L.temperatureIndexMin,
    L.temperatureIndexMax,
  );
  const accretionRate = clamp(p.accretionRate, L.accretionRateMin);
  const cameraDistance = clamp(p.cameraDistance, L.cameraDistanceMin);

  const primary = resolveHole(
    primaryMass,
    spin,
    diskAspectRatio,
    diskOuterRadiusM,
  );
  const secondary = resolveHole(
    secondaryMass,
    spin,
    diskAspectRatio,
    diskOuterRadiusM,
  );

  return {
    primaryMass: primary.mass,
    secondaryMass: secondary.mass,
    totalMass,
    massRatio,
    separation,
    orbitalFrequency: binaryOrbitalOmega(totalMass, separation),
    spin,
    primarySpinA: primary.a,
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
