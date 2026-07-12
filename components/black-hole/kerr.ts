/**
 * Kerr / Schwarzschild length scales (geometric units G = c = 1).
 *
 * Pure functions — no site defaults, theme, or render knobs.
 * Used by {@link buildBlackHoleConfig} and available for tests.
 *
 * @module components/black-hole/kerr
 */

import { SPIN_LIMITS } from "./limits";

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
export function clampSpin(chi: number): number {
  if (!Number.isFinite(chi)) return 0;
  const m = SPIN_LIMITS.absMax;
  return Math.min(m, Math.max(-m, chi));
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
export function photonSphereRadius(
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
export function iscoRadius(
  mass: number,
  chi: number,
  prograde: boolean,
): number {
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
 * **Note:** The binary banner uses Newtonian two-body mean motion
 * `√(M_tot / d³)` for orbital phase, not this helper. Kept for single-hole /
 * disk Kepler estimates and tests.
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
