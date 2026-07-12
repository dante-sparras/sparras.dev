/**
 * Pure disk / orbital physics for the banner (geometric units G = c = 1).
 * CPU reference — keep in sync with TSL ports in shader/*.
 *
 * @module components/black-hole/disk-physics
 */

import { clampSpin, keplerOmega } from "./kerr";

/** T(r) = T_peak_K · (r_in / r)^α with r ≥ r_in. peakTemperatureUnits are 1000 K. */
export function diskTemperatureK(
  r: number,
  rIn: number,
  peakTemperatureUnits: number,
  alpha: number,
): number {
  const rin = Math.max(rIn, 1e-6);
  const radius = Math.max(r, rin);
  const peakK = Math.max(peakTemperatureUnits, 1e-6) * 1000;
  const a = Math.min(1.5, Math.max(0.5, alpha));
  return peakK * Math.pow(rin / radius, a);
}

/** Prograde circular equatorial Ω (same as {@link keplerOmega}). */
export function kerrCircularOmega(
  r: number,
  mass: number,
  spinChi: number,
): number {
  return keplerOmega(r, mass, spinChi);
}

/**
 * Approximate orbital 3-speed β = v/c for a prograde circular emitter.
 * Uses Kerr Ω and circumferential radius ≈ r (equatorial BL r).
 * Caps for numerical safety in the banner.
 */
export function circularOrbitalBeta(
  r: number,
  mass: number,
  spinChi: number,
): number {
  const M = Math.max(1e-4, mass);
  const radius = Math.max(r, 1.001 * M);
  const omega = kerrCircularOmega(radius, M, spinChi);
  // v ≈ Ω · ϖ; ϖ ~ r in geometric units for equatorial circular
  const beta = Math.abs(omega * radius);
  return Math.min(0.85, Math.max(0, beta));
}

/**
 * Gravitational redshift factor for a static observer near Schwarzschild/Kerr
 * (approx √(1 - 2M/r) with spin floor at horizon).
 */
export function gravitationalRedshift(
  r: number,
  mass: number,
  spinChi: number,
): number {
  const M = Math.max(1e-4, mass);
  const chi = clampSpin(spinChi);
  const a = chi * M;
  const rPlus = M + Math.sqrt(Math.max(0, M * M - a * a));
  const radius = Math.max(r, rPlus * 1.02);
  // Approximate lapse: √(Δ Σ) / … → use Schw-like √(1-2M/r) with floor
  const gtt = 1 - (2 * M) / radius;
  return Math.sqrt(Math.max(1e-4, gtt));
}

/**
 * Special-relativistic Doppler factor for an emitter with speed β toward/away
 * from the observer along the ray (μ = cos angle between v and line-of-sight
 * toward the observer; μ > 0 when approaching).
 *
 * g_sr = √(1-β²) / (1 - β μ)
 */
export function specialRelDopplerG(beta: number, mu: number): number {
  const b = Math.min(0.85, Math.max(0, beta));
  const m = Math.min(1, Math.max(-1, mu));
  const denom = 1 - b * m;
  if (denom <= 1e-4) return 2.5;
  return Math.sqrt(Math.max(1e-6, 1 - b * b)) / denom;
}

/**
 * Combined disk frequency shift g = ν_obs / ν_em ≈ g_grav · g_sr.
 * Clamped for shader stability.
 */
export function diskDopplerG(args: {
  r: number;
  mass: number;
  spinChi: number;
  /** cos angle between orbital velocity and line-of-sight (approaching > 0). */
  mu: number;
}): number {
  const beta = circularOrbitalBeta(args.r, args.mass, args.spinChi);
  const gSr = specialRelDopplerG(beta, args.mu);
  const gGrav = gravitationalRedshift(args.r, args.mass, args.spinChi);
  return Math.min(2.5, Math.max(0.3, gSr * gGrav));
}

/** Bolometric-ish intensity transform I_obs ∝ g³ I_em (thermal disk convention). */
export function intensityDopplerWeight(g: number): number {
  const gg = Math.min(2.5, Math.max(0.3, g));
  return gg * gg * gg;
}
