/**
 * Named numeric limits for the black-hole banner.
 * Single source of truth — used by build, host, CPU physics, and TSL (`float(X)`).
 *
 * @module components/black-hole/limits
 */

/** Clamps for raw public knobs and derived safety floors. */
export const PHYSICS_LIMITS = {
  /** Minimum primary mass M₁. */
  primaryMassMin: 0.08,
  /** Mass ratio q = M₂/M₁. */
  massRatioMin: 0.15,
  massRatioMax: 4,
  /** Center-to-center separation d. */
  separationMin: 2.5,
  /** Observer distance D. */
  cameraDistanceMin: 8,
  /** Orbit zoom absolute floor (also used when D is large). */
  orbitMinFloor: 4,
  /** Orbit min as fraction of D (secondary constraint). */
  orbitMinOfDistance: 0.45,
  /** Orbit max as multiple of D. */
  orbitMaxOfDistance: 2.8,
  /** Extra zoom-out headroom vs binary outer radius. */
  orbitMaxOfExtent: 2.4,
  /** Keep skydome outside max orbit. */
  skyDomeOfOrbitMax: 1.2,
  skyDomeMin: 80,
  /** Mini-disk r_out / Mᵢ. */
  diskOuterRadiusMMin: 3,
  /** H/R aspect. */
  diskAspectMin: 0.005,
  diskAspectMax: 0.25,
  /** Peak T in 1000 K units. */
  peakTemperatureMin: 1,
  /** α in T ∝ r^{-α}. */
  temperatureIndexMin: 0.5,
  temperatureIndexMax: 1.5,
  /** ∝ Ṁ. */
  accretionRateMin: 0.1,
  /** Light theme multiplies accretion (presentation). */
  lightThemeAccretionScale: 0.55,
  /** Inclination degrees. */
  inclinationMin: 0,
  inclinationMax: 180,
  /** Fallback when inclination is non-finite. */
  inclinationFallback: 62,
  /** Minimum absolute disk scale height (geometric). */
  scaleHeightFloor: 0.05,
} as const;

/** Dimensionless spin open interval (shared CPU + TSL). */
export const SPIN_LIMITS = {
  absMax: 0.998,
} as const;

/** Doppler / orbital-speed numerical safety (CPU + TSL). */
export const DOPPLER_LIMITS = {
  betaCap: 0.85,
  gMin: 0.3,
  gMax: 2.5,
  /** Floor radius in units of M for β/g. */
  radiusOverMassMin: 1.05,
  massFloor: 1e-4,
  radiusFloor: 1e-3,
} as const;

/** Absolute-temperature → peach palette (CPU + TSL heat map). */
export const PALETTE_LIMITS = {
  coolFloorK: 8_000,
  hotCeilK: 80_000,
  heatPower: 1.25,
} as const;

/** Camera presentation (not a public physics knob). */
export const CAMERA = {
  fovDeg: 48,
  /** Small azimuthal bias so edge-on view is not perfectly symmetric. */
  azimuthBias: 0.12,
} as const;
