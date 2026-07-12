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
 * 3. {@link defaultRender} — pixel-art only (not public knobs)
 *
 * ## Configure (partial only)
 * ```ts
 * buildBlackHoleConfig({ spin: 0.8, inclination: 135 })
 * buildBlackHoleConfig({ physics: { spin: 0.8 } })
 * <BlackHole spin={0.8} inclination={135} />
 * <BlackHole physics={{ separation: 16 }} />
 * ```
 *
 * Public knobs are raw only. Derived scales are never user inputs.
 * Theme dimming is **not** applied here — use {@link withLightThemeAccretion}.
 *
 * @module components/black-hole/config
 */

import { binaryOrbitalOmega } from "./binary";
import { clampSpin, kerrScales } from "./kerr";
import { CAMERA, PHYSICS_LIMITS } from "./limits";

export type { KerrScales } from "./kerr";
export {
  clampSpin,
  iscoRadius,
  keplerOmega,
  kerrScales,
  photonSphereRadius,
} from "./kerr";
export {
  CAMERA,
  DOPPLER_LIMITS,
  PALETTE_LIMITS,
  PHYSICS_LIMITS,
  SPIN_LIMITS,
} from "./limits";

/**
 * Clamp observer inclination in **degrees** from the orbital / disk normal.
 * - `0` face-on +Y · `90` edge-on · `180` face-on −Y
 */
export function clampInclinationDegrees(inclination: number): number {
  if (!Number.isFinite(inclination)) return PHYSICS_LIMITS.inclinationFallback;
  return Math.min(
    PHYSICS_LIMITS.inclinationMax,
    Math.max(PHYSICS_LIMITS.inclinationMin, inclination),
  );
}

/** Vertical FOV used by the host canvas and shader ray basis. */
export const CAMERA_FOV_DEG = CAMERA.fovDeg;

/**
 * Characteristic outer radius of the binary (arms + mini-disk extents).
 * Used for orbit min (avoid tunneling) and zoom-out headroom.
 */
export function binaryVisualExtent(config: {
  separation: number;
  primaryMass: number;
  secondaryMass: number;
  diskOuterRadiusM: number;
  eventHorizonPrimary: number;
  eventHorizonSecondary: number;
}): number {
  const arm = config.separation * 0.5;
  const disk1 = config.diskOuterRadiusM * config.primaryMass;
  const disk2 = config.diskOuterRadiusM * config.secondaryMass;
  const hole = Math.max(
    config.eventHorizonPrimary,
    config.eventHorizonSecondary,
  );
  return Math.max(
    arm + Math.max(disk1, disk2),
    hole * 3,
    config.separation * 0.55,
  );
}

/**
 * Orbit zoom limits from observer distance **and** binary geometry.
 * - **min**: stay outside the visual binary (no zoom into/through holes)
 * - **max**: allow pull-back past D without leaving useful framing
 */
export function orbitDistanceLimits(
  cameraDistance: number,
  extent?: number,
): { min: number; max: number } {
  const d = Math.max(PHYSICS_LIMITS.cameraDistanceMin, cameraDistance);
  const visual = Math.max(0, extent ?? 0);
  const minFromGeometry =
    visual > 0 ? visual * 1.15 : PHYSICS_LIMITS.orbitMinFloor;
  const min = Math.max(
    PHYSICS_LIMITS.orbitMinFloor,
    minFromGeometry,
    d * PHYSICS_LIMITS.orbitMinOfDistance * 0.35, // soft floor vs D only when close
  );
  // Prefer not locking min above a large D (user zoomed out already)
  const minClamped = Math.min(min, d * 0.92);
  const max = Math.max(
    d * PHYSICS_LIMITS.orbitMaxOfDistance,
    visual * PHYSICS_LIMITS.orbitMaxOfExtent,
    minClamped + 4,
  );
  return { min: Math.min(minClamped, max * 0.5), max };
}

/**
 * Inverted skydome radius — must stay larger than orbit max zoom.
 */
export function skyDomeRadius(orbitMaxDistance: number): number {
  return Math.max(
    PHYSICS_LIMITS.skyDomeMin,
    orbitMaxDistance * PHYSICS_LIMITS.skyDomeOfOrbitMax,
  );
}

// ── Public physics surface ──────────────────────────────────────────────────

/**
 * Canonical list of raw physics knobs.
 * @see {@link BlackHoleOverrides}
 */
export const RAW_PHYSICS_KEYS = [
  "primaryMass",
  "massRatio",
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
export type BlackHoleOverrides = Partial<{
  /**
   * Primary mass **M₁** (geometric units).
   * - Lower → smaller primary · Higher → larger primary / stronger lensing
   * - Clamped ≥ {@link PHYSICS_LIMITS.primaryMassMin}
   * @defaultValue 0.5
   */
  primaryMass: number;

  /**
   * Mass ratio **q = M₂ / M₁**.
   * - ≪1 light secondary · 1 equal · ≫1 heavy secondary
   * - Clamped [{@link PHYSICS_LIMITS.massRatioMin}, {@link PHYSICS_LIMITS.massRatioMax}]
   * @defaultValue 1.5
   */
  massRatio: number;

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
   * - Light theme: apply {@link withLightThemeAccretion} in the host
   * @defaultValue 5
   */
  accretionRate: number;
}>;

/** Fully specified raw physics surface. */
export type RawBlackHolePhysics = Required<BlackHoleOverrides>;

/** Pick only raw physics keys from a loose object. */
export function pickPhysicsOverrides(
  source: Partial<Record<RawPhysicsKey, unknown>> | null | undefined,
): BlackHoleOverrides {
  if (!source) return {};
  const out: BlackHoleOverrides = {};
  for (const key of RAW_PHYSICS_KEYS) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      out[key] = value;
    }
  }
  return out;
}

/** Shallow-merge partial physics layers (later wins). */
export function mergePhysicsOverrides(
  ...layers: Array<BlackHoleOverrides | undefined | null>
): BlackHoleOverrides {
  const out: BlackHoleOverrides = {};
  for (const layer of layers) {
    if (!layer) continue;
    for (const key of RAW_PHYSICS_KEYS) {
      const value = layer[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        out[key] = value;
      }
    }
  }
  return out;
}

/**
 * Stable key for React deps: only changes when raw knobs change.
 * Avoids `rest` object identity thrashing every render.
 */
export function physicsOverridesKey(physics: BlackHoleOverrides): string {
  const parts: string[] = [];
  for (const key of RAW_PHYSICS_KEYS) {
    const v = physics[key];
    if (typeof v === "number" && Number.isFinite(v)) {
      parts.push(`${key}:${v}`);
    }
  }
  return parts.join("|");
}

// ── Resolved config ─────────────────────────────────────────────────────────

/**
 * Fully resolved simulation state after clamps, Kerr scales, and Kepler Ω.
 */
export type BlackHoleConfig = {
  primaryMass: number;
  secondaryMass: number;
  totalMass: number;
  massRatio: number;
  separation: number;
  /** Ω = √(M_tot / d³) */
  orbitalFrequency: number;

  spin: number;
  /** Primary a = χ M₁ */
  spinParameter: number;
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

/**
 * Options for {@link buildBlackHoleConfig}.
 * Flat knobs and/or one nested `physics` bag. No other aliases.
 * Merge: `physics` then top-level knobs (later wins).
 */
export type BuildBlackHoleConfigOptions = BlackHoleOverrides & {
  /** Nested partial physics bag (optional grouping). */
  physics?: BlackHoleOverrides;
};

// ── Defaults ────────────────────────────────────────────────────────────────

/**
 * Site physics defaults for the hero banner.
 * Edit here for production look, or pass partials at call sites.
 */
export const defaultPhysics = {
  primaryMass: 0.5,
  massRatio: 1.5,
  separation: 20,
  spin: 0.5,
  inclination: 98,
  cameraDistance: 30,
  diskOuterRadiusM: 15,
  diskAspectRatio: 0.05,
  peakTemperature: 50,
  temperatureIndex: 1,
  accretionRate: 5,
} as const satisfies Required<BlackHoleOverrides>;

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

function mergePhysics(
  base: typeof defaultPhysics,
  overrides: BlackHoleOverrides,
): Required<BlackHoleOverrides> {
  return { ...base, ...overrides };
}

/** Defaults + partial layers (no Kerr derivation). */
export function resolvePhysics(
  ...layers: Array<BlackHoleOverrides | undefined | null>
): Required<BlackHoleOverrides> {
  return mergePhysics(defaultPhysics, mergePhysicsOverrides(...layers));
}

/**
 * World-space camera looking at origin.
 * Disk plane XZ; inclination 0 → +Y, 90 edge-on, 180 → −Y.
 */
export function cameraPositionFromObserver(
  inclination: number,
  cameraDistance: number,
): [number, number, number] {
  const inclinationRadians =
    (clampInclinationDegrees(inclination) * Math.PI) / 180;
  const distance = Math.max(PHYSICS_LIMITS.cameraDistanceMin, cameraDistance);
  const sinI = Math.sin(inclinationRadians);
  const cosI = Math.cos(inclinationRadians);
  const bias = CAMERA.azimuthBias;
  return [distance * sinI * bias, distance * cosI, distance * sinI];
}

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
    PHYSICS_LIMITS.scaleHeightFloor,
    aspect * characteristicDiskRadius(isco, mass, diskOuterRadiusM),
  );
}

type ResolvedHole = {
  mass: number;
  eventHorizon: number;
  photonSphere: number;
  isco: number;
  diskScaleHeight: number;
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
 * Pure resolve: merge knobs → clamps → Kerr scales → Ω.
 * Does **not** apply light-theme dimming.
 */
export function buildBlackHoleConfig(
  options: BuildBlackHoleConfigOptions = {},
): BlackHoleConfig {
  const { physics: physicsBag, ...rest } = options;
  const flat = pickPhysicsOverrides(rest);
  const merged = mergePhysicsOverrides(physicsBag, flat);
  const physics = mergePhysics(defaultPhysics, merged);

  const L = PHYSICS_LIMITS;
  const primaryMass = Math.max(L.primaryMassMin, physics.primaryMass);
  const massRatio = Math.min(
    L.massRatioMax,
    Math.max(L.massRatioMin, physics.massRatio),
  );
  const secondaryMass = primaryMass * massRatio;
  const totalMass = primaryMass + secondaryMass;
  const separation = Math.max(L.separationMin, physics.separation);
  const spin = clampSpin(physics.spin);
  const inclination = clampInclinationDegrees(physics.inclination);
  const diskOuterRadiusM = Math.max(
    L.diskOuterRadiusMMin,
    physics.diskOuterRadiusM,
  );
  const diskAspectRatio = Math.min(
    L.diskAspectMax,
    Math.max(L.diskAspectMin, physics.diskAspectRatio),
  );
  const peakTemperature = Math.max(
    L.peakTemperatureMin,
    physics.peakTemperature,
  );
  const temperatureIndex = Math.min(
    L.temperatureIndexMax,
    Math.max(L.temperatureIndexMin, physics.temperatureIndex),
  );
  const accretionRate = Math.max(L.accretionRateMin, physics.accretionRate);
  const cameraDistance = Math.max(L.cameraDistanceMin, physics.cameraDistance);

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

/**
 * Presentation: dim accretion for light page backgrounds.
 * Pure — call from the host after {@link buildBlackHoleConfig}.
 */
export function withLightThemeAccretion(
  config: BlackHoleConfig,
  enabled: boolean,
): BlackHoleConfig {
  if (!enabled) return config;
  return {
    ...config,
    accretionRate:
      config.accretionRate * PHYSICS_LIMITS.lightThemeAccretionScale,
  };
}
