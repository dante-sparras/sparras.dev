/**
 * Binary black-hole configuration.
 *
 * ## Units
 * Geometric units throughout: **G = c = 1**. A mass **M** also sets the length
 * and time scale (r_s = 2M for Schwarzschild).
 *
 * ## Layers
 * 1. {@link BlackHoleOverrides} / {@link defaultPhysics} — what you edit
 * 2. {@link BlackHoleConfig} — resolved masses, Kerr scales, Kepler Ω, render
 * 3. {@link defaultRender} — pixel-art only (not public overrides)
 *
 * Kerr helpers: {@link kerrScales}, {@link keplerOmega}.
 *
 * @module components/black-hole/config
 */

import type { ResolvedTheme } from "@/components/providers";

// ── Kerr / Schwarzschild (geometric units G=c=1) ──────────────────────

export type KerrScales = {
  /** Mass M. */
  mass: number;
  /** Dimensionless spin χ = a/M. */
  spin: number;
  /** Dimensional spin a = χ M. */
  a: number;
  /** Outer event horizon r₊. */
  eventHorizon: number;
  /** Inner Cauchy horizon r₋ (zero when χ = 0). */
  eventHorizonInner: number;
  /**
   * Equatorial photon-sphere radius (co-rotating branch).
   * Approaches M as χ → +1; equals 3M when χ = 0.
   */
  photonSphere: number;
  /** Prograde (co-rotating) innermost stable circular orbit. */
  iscoPrograde: number;
  /** Retrograde (counter-rotating) ISCO. */
  iscoRetrograde: number;
  /** Schwarzschild radius r_s = 2M (equals r₊ only when χ = 0). */
  schwarzschildRadius: number;
};

/**
 * Clamp dimensionless spin into a safe open interval (−1, 1).
 * Avoids √0 edge cases and naked-singularity parameters.
 */
function clampSpin(chi: number): number {
  if (!Number.isFinite(chi)) return 0;
  return Math.min(0.998, Math.max(-0.998, chi));
}

/**
 * Equatorial photon orbit radius (Bardeen 1973).
 *
 * r_ph / M = 2 (1 + cos(⅔ arccos(∓|χ|)))
 * - co-rotating (prograde): arccos(−|χ|) → r_ph → M as χ → 1
 * - counter-rotating: arccos(+|χ|) → r_ph → 4M as χ → 1
 *
 * @param mass - Black-hole mass M
 * @param chi - Dimensionless spin (sign ignored; branch from `prograde`)
 * @param prograde - `true` for co-rotating photon orbit
 */
function photonSphereRadius(
  mass: number,
  chi: number,
  prograde: boolean,
): number {
  const chiAbs = Math.abs(clampSpin(chi));
  const argument = Math.acos(
    Math.min(1, Math.max(-1, prograde ? -chiAbs : chiAbs)),
  );
  return 2 * mass * (1 + Math.cos((2 / 3) * argument));
}

/**
 * ISCO for Kerr equatorial circular orbits (Bardeen, Press & Teukolsky 1972).
 *
 * With a\* = |χ|:
 * - Z₁ = 1 + (1−a\*²)^{1/3} [(1+a\*)^{1/3} + (1−a\*)^{1/3}]
 * - Z₂ = √(3 a\*² + Z₁²)
 * - r_ISCO / M = 3 + Z₂ ∓ √[(3−Z₁)(3+Z₁+2Z₂)]
 *   - **minus** → prograde / co-rotating (smaller radius)
 *   - **plus**  → retrograde / counter-rotating
 *
 * Spin **sign** does not flip the branch: co-rotating always uses the closer root.
 *
 * @param mass - Black-hole mass M
 * @param chi - Dimensionless spin
 * @param prograde - `true` for co-rotating ISCO
 */
function iscoRadius(mass: number, chi: number, prograde: boolean): number {
  const chiAbs = Math.abs(clampSpin(chi));
  if (chiAbs < 1e-8) return 6 * mass;

  const z1 =
    1 +
    Math.pow(1 - chiAbs * chiAbs, 1 / 3) *
      (Math.pow(1 + chiAbs, 1 / 3) + Math.pow(1 - chiAbs, 1 / 3));
  const z2 = Math.sqrt(3 * chiAbs * chiAbs + z1 * z1);
  const radical = Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
  const radiusOverMass = prograde ? 3 + z2 - radical : 3 + z2 + radical;
  return Math.max(radiusOverMass, 1.001) * mass;
}

/**
 * Derive all Kerr length scales from mass + dimensionless spin.
 *
 * @param mass - Black-hole mass M (> 0)
 * @param spin - Dimensionless spin χ = a/M
 */
export function kerrScales(mass: number, spin: number): KerrScales {
  const M = Math.max(1e-4, mass);
  const chi = clampSpin(spin);
  const a = chi * M;
  const discriminant = Math.sqrt(Math.max(0, 1 - chi * chi));
  const outerHorizon = M * (1 + discriminant);
  const innerHorizon = M * (1 - discriminant);

  return {
    mass: M,
    spin: chi,
    a,
    eventHorizon: outerHorizon,
    eventHorizonInner: innerHorizon,
    photonSphere: photonSphereRadius(M, chi, true),
    iscoPrograde: iscoRadius(M, chi, true),
    iscoRetrograde: iscoRadius(M, chi, false),
    schwarzschildRadius: 2 * M,
  };
}

/**
 * Angular velocity of a prograde circular equatorial orbit (geometric units).
 *
 * Ω = 1 / (r^{3/2} / √M + a)
 *
 * @param radius - Orbital radius r
 * @param mass - Black-hole mass M
 * @param spin - Dimensionless spin χ
 */
export function keplerOmega(
  radius: number,
  mass: number,
  spin: number,
): number {
  const M = Math.max(1e-4, mass);
  const a = clampSpin(spin) * M;
  const sqrtMass = Math.sqrt(M);
  return 1 / (Math.pow(Math.max(radius, 1e-3), 1.5) / sqrtMass + a);
}

// ── Public physics surface ──────────────────────────────────────────────────

/**
 * User-editable **physics and observer** parameters.
 *
 * Every field is optional; omitted keys fall back to {@link defaultPhysics}.
 * Do not put pixel-art or numerical fudge factors here.
 */
export type BlackHoleOverrides = Partial<{
  /**
   * Primary black-hole mass **M₁** (geometric units).
   * Sets the length scale of the primary and its mini-disk.
   * @defaultValue 0.5
   */
  primaryMass: number;

  /**
   * Mass ratio **q = M₂ / M₁**.
   * Secondary mass is derived as `primaryMass × massRatio`.
   * Clamped to about `[0.15, 4]` when building the config.
   * @defaultValue 1
   */
  massRatio: number;

  /**
   * Center-to-center orbital separation **d** (geometric units).
   *
   * Hole barycentric distances:
   * - r₁ = d · M₂ / M_tot
   * - r₂ = d · M₁ / M_tot
   *
   * Circular Kepler angular frequency: **Ω = √(M_tot / d³)**.
   * The camera only pulls back if both holes would leave the FOV, so changing
   * `separation` is visible on screen.
   * @defaultValue 12
   */
  separation: number;

  /**
   * Dimensionless spin **χ = a / M**, applied to **both** holes (`|χ| < 1`).
   * Feeds Kerr outer horizon r₊, equatorial photon sphere, and prograde ISCO.
   * @defaultValue 0.35
   */
  spin: number;

  /**
   * Observer inclination **i** in **degrees** from the orbital / disk normal.
   * - `0` = face-on (looking down +Y)
   * - `90` = edge-on
   * @defaultValue 62
   */
  inclination: number;

  /**
   * Observer distance **D** from the system barycenter (geometric units).
   * If omitted, uses the site default and may increase slightly when
   * `separation` is large so both holes stay in frame.
   * @defaultValue 28
   */
  cameraDistance: number;

  /**
   * Mini-disk outer radius in units of **each hole’s own mass**:
   * `r_out = diskOuterRadiusM × Mᵢ`.
   * Inner edge is the prograde ISCO of that hole.
   * @defaultValue 12
   */
  diskOuterRadiusM: number;

  /**
   * Disk aspect ratio **H / R** (vertical scale height over cylindrical radius).
   * Larger → thicker gas column along the line of sight → brighter rings.
   * Thin-disk theory: typically ≪ 1; visual range roughly `0.05`–`0.12`.
   * @defaultValue 0.06
   */
  diskAspectRatio: number;

  /**
   * Peak effective temperature near the ISCO, in units of **1000 K**.
   * Example: `48` → T_peak = 48 000 K.
   *
   * Used for:
   * - Thin-disk profile `T(r) = T_peak · (r_in / r)^temperatureIndex` (brightness)
   * - Slight bias of the fire red→amber radial color curve
   *
   * Visual guide:
   * - ~30 → redder outer annuli
   * - ~48 → reference-like fire orange
   * - ~70 → brighter amber inner (still not white)
   * @defaultValue 48
   */
  peakTemperature: number;

  /**
   * Radial temperature index **α** in **T ∝ r^{−α}**.
   * Shakura–Sunyaev / multi-temperature thin disk: **α ≈ 0.75**.
   * Lower α → outer disk stays warmer; higher → steeper cool-down with radius.
   * @defaultValue 0.75
   */
  temperatureIndex: number;

  /**
   * Relative accretion rate / surface emissivity (∝ **Ṁ**).
   * Primary brightness control. Does not change geometry.
   * @defaultValue 8.5
   */
  accretionRate: number;
}>;

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
   * Absolute vertical scale height in geometric units,
   * ≈ (H/R) × characteristic mid-disk radius.
   */
  diskScaleHeight: number;
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
  massRatio: 1,
  separation: 12,
  spin: 0.35,
  inclination: 62,
  cameraDistance: 28,
  diskOuterRadiusM: 12,
  diskAspectRatio: 0.06,
  peakTemperature: 48,
  temperatureIndex: 0.75,
  accretionRate: 8.5,
} as const satisfies Required<BlackHoleOverrides>;

/**
 * Numerical / pixel-art presentation parameters.
 * Intentionally **not** on the public override surface.
 */
export const defaultRender = {
  /** Base raymarch step (smaller → sharper near horizons, costlier). */
  stepSize: 0.55,
  /** Pixel cell size (larger → chunkier pixel art, cheaper). */
  pixelSize: 3,
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
  return {
    primaryMass: overrides.primaryMass ?? base.primaryMass,
    massRatio: overrides.massRatio ?? base.massRatio,
    separation: overrides.separation ?? base.separation,
    spin: overrides.spin ?? base.spin,
    inclination: overrides.inclination ?? base.inclination,
    cameraDistance: overrides.cameraDistance ?? base.cameraDistance,
    diskOuterRadiusM: overrides.diskOuterRadiusM ?? base.diskOuterRadiusM,
    diskAspectRatio: overrides.diskAspectRatio ?? base.diskAspectRatio,
    peakTemperature: overrides.peakTemperature ?? base.peakTemperature,
    temperatureIndex: overrides.temperatureIndex ?? base.temperatureIndex,
    accretionRate: overrides.accretionRate ?? base.accretionRate,
  };
}

/**
 * World-space camera position looking at the origin.
 *
 * Disk / orbital plane is **XZ**. Inclination `0` places the camera on +Y
 * (face-on). A small azimuthal offset avoids a perfectly edge-symmetric view.
 *
 * @param inclination - Degrees from the orbital normal
 * @param cameraDistance - Distance from the barycenter
 */
export function cameraPositionFromObserver(
  inclination: number,
  cameraDistance: number,
): [number, number, number] {
  const inclinationRadians =
    (Math.min(89.5, Math.max(0.5, inclination)) * Math.PI) / 180;
  const distance = Math.max(8, cameraDistance);
  const x = distance * Math.sin(inclinationRadians) * 0.12;
  const y = distance * Math.cos(inclinationRadians);
  const z = distance * Math.sin(inclinationRadians);
  return [x, y, z];
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
  const cameraDistanceExplicit = overrides.cameraDistance !== undefined;
  const physics = mergePhysics(defaultPhysics, overrides);

  const primaryMass = Math.max(0.08, physics.primaryMass);
  const massRatio = Math.min(4, Math.max(0.15, physics.massRatio));
  const secondaryMass = primaryMass * massRatio;
  const totalMass = primaryMass + secondaryMass;
  const separation = Math.max(2.5, physics.separation);
  const spin = Math.min(0.998, Math.max(-0.998, physics.spin));
  const inclination = Math.min(89.5, Math.max(0.5, physics.inclination));
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

  let cameraDistance = cameraDistanceExplicit
    ? physics.cameraDistance
    : defaultPhysics.cameraDistance;
  // Pull back only if the binary would leave the FOV — keeps separation visible
  cameraDistance = Math.max(cameraDistance, separation * 1.55 + 4, 12);

  const primaryScales = kerrScales(primaryMass, spin);
  const secondaryScales = kerrScales(secondaryMass, spin);
  /** Circular two-body mean motion Ω = √(M / d³). */
  const orbitalFrequency = Math.sqrt(totalMass / separation ** 3);

  const characteristicRadius =
    0.5 * (primaryScales.iscoPrograde + diskOuterRadiusM * primaryMass);
  const diskScaleHeight = Math.max(
    0.05,
    diskAspectRatio * characteristicRadius,
  );

  if (themeColors && mode === "light") {
    accretionRate *= 0.55;
  }

  return {
    primaryMass,
    secondaryMass,
    totalMass,
    massRatio,
    separation,
    orbitalFrequency,
    spin,
    spinParameter: primaryScales.a,
    eventHorizonPrimary: primaryScales.eventHorizon,
    eventHorizonSecondary: secondaryScales.eventHorizon,
    photonSpherePrimary: primaryScales.photonSphere,
    photonSphereSecondary: secondaryScales.photonSphere,
    iscoPrimary: primaryScales.iscoPrograde,
    iscoSecondary: secondaryScales.iscoPrograde,

    inclination,
    cameraDistance,

    diskOuterRadiusM,
    diskAspectRatio,
    diskScaleHeight,
    peakTemperature,
    temperatureIndex,
    accretionRate,

    stepSize: defaultRender.stepSize,
    pixelSize: defaultRender.pixelSize,
    ditherStrength: defaultRender.ditherStrength,
    colorLevels: defaultRender.colorLevels,
  };
}
