// @ts-nocheck
// Three.js TSL Fn() bodies are not accurately typed.

/**
 * Local Kerr null deflection (Cartesian Kerr-Schild–inspired) for one hole.
 * Spin axis = +Y (disk normal). `relPos` is relative to the hole center.
 *
 * Matches CPU `kerr-geodesic.ts` for banner use (not full BL Christoffel).
 */

import {
  vec3,
  float,
  Fn,
  length,
  normalize,
  cross,
  max,
  clamp,
} from "three/tsl";

/**
 * kerrNullDeflect(relPos, rayDir, mass, spinChi, dStep) → new unit rayDir
 */
export const kerrNullDeflect = Fn(([relPos, rayDir, mass, spinChi, dStep]) => {
  const M = max(mass, float(1e-4));
  const chi = clamp(spinChi, float(-0.998), float(0.998));
  const a = chi.mul(M);
  const r = max(length(relPos), float(1e-4));
  const rHat = normalize(relPos);
  const dHat = normalize(rayDir);

  // Leading null deflection ∝ 2M/r² (Schwarzschild term)
  const bend = rHat.mul(M.mul(2).div(r.mul(r)).mul(dStep).negate());

  // Frame-drag: spinAxis (+Y) × dir, strength ∝ a M / r³
  const spinAxis = vec3(0, 1, 0);
  const dragScale = a.mul(2).mul(M).div(r.mul(r).mul(r)).mul(dStep);
  const drag = cross(spinAxis, dHat).mul(dragScale);

  return normalize(dHat.add(bend).add(drag));
});
