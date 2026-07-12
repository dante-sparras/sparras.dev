/**
 * Pure disk / orbital physics for the banner (geometric units G = c = 1).
 * CPU reference — TSL ports in shader/* must use the same {@link DOPPLER_LIMITS}.
 *
 * @module components/black-hole/physics/disk
 */

import { clampSpin, keplerOmega } from "./kerr";
import { DOPPLER_LIMITS, PHYSICS_LIMITS } from "./limits";

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
  const a = Math.min(
    PHYSICS_LIMITS.temperatureIndexMax,
    Math.max(PHYSICS_LIMITS.temperatureIndexMin, alpha),
  );
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
 */
export function circularOrbitalBeta(
  r: number,
  mass: number,
  spinChi: number,
): number {
  const M = Math.max(DOPPLER_LIMITS.massFloor, mass);
  const radius = Math.max(r, 1.001 * M);
  const omega = kerrCircularOmega(radius, M, spinChi);
  const beta = Math.abs(omega * radius);
  return Math.min(DOPPLER_LIMITS.betaCap, Math.max(0, beta));
}

/**
 * Gravitational redshift ≈ √(1 - 2M/r) with horizon floor.
 */
export function gravitationalRedshift(
  r: number,
  mass: number,
  spinChi: number,
): number {
  const M = Math.max(DOPPLER_LIMITS.massFloor, mass);
  const chi = clampSpin(spinChi);
  const a = chi * M;
  const rPlus = M + Math.sqrt(Math.max(0, M * M - a * a));
  const radius = Math.max(r, rPlus * 1.02);
  const gtt = 1 - (2 * M) / radius;
  return Math.sqrt(Math.max(1e-4, gtt));
}

/**
 * Special-relativistic Doppler: g_sr = √(1-β²) / (1 - β μ)
 */
export function specialRelDopplerG(beta: number, mu: number): number {
  const b = Math.min(DOPPLER_LIMITS.betaCap, Math.max(0, beta));
  const m = Math.min(1, Math.max(-1, mu));
  const denom = 1 - b * m;
  if (denom <= 1e-4) return DOPPLER_LIMITS.gMax;
  return Math.sqrt(Math.max(1e-6, 1 - b * b)) / denom;
}

/**
 * Combined disk frequency shift g ≈ g_grav · g_sr, clamped.
 */
export function diskDopplerG(args: {
  r: number;
  mass: number;
  spinChi: number;
  mu: number;
}): number {
  const beta = circularOrbitalBeta(args.r, args.mass, args.spinChi);
  const gSr = specialRelDopplerG(beta, args.mu);
  const gGrav = gravitationalRedshift(args.r, args.mass, args.spinChi);
  return Math.min(
    DOPPLER_LIMITS.gMax,
    Math.max(DOPPLER_LIMITS.gMin, gSr * gGrav),
  );
}

/** I_obs ∝ g³ I_em */
export function intensityDopplerWeight(g: number): number {
  const gg = Math.min(DOPPLER_LIMITS.gMax, Math.max(DOPPLER_LIMITS.gMin, g));
  return gg * gg * gg;
}
