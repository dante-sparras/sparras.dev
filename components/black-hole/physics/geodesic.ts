/**
 * Pure Kerr geodesic helpers (CPU) for tests and documentation.
 * GPU uses a local Kerr-Schild–style null step in shader/geodesic.ts.
 *
 * Spin axis in the banner is +Y (disk normal); orbital plane is XZ.
 *
 * @module components/black-hole/physics/geodesic
 */

import { clampSpin } from "./kerr";

export type Vec3 = readonly [number, number, number];

function len(v: Vec3): number {
  return Math.hypot(v[0], v[1], v[2]);
}

function norm(v: Vec3): Vec3 {
  const L = Math.max(len(v), 1e-12);
  return [v[0] / L, v[1] / L, v[2] / L];
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scale(v: Vec3, s: number): Vec3 {
  return [v[0] * s, v[1] * s, v[2] * s];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/**
 * One null-ish step in a local Kerr field (Cartesian Kerr-Schild inspired).
 *
 * - Gravity: −M r̂ / r²  (Schwarzschild leading term)
 * - Frame drag: gravitomagnetic term ∝ a × v / r³ coupled to light direction
 *
 * Not a full BL Christoffel integrator; matches the GPU path for tests.
 *
 * @param pos - Position relative to hole center (world-like; spin ∥ +Y)
 * @param dir - Unit direction of the ray
 * @param mass - M
 * @param spinChi - χ = a/M
 * @param dLambda - step size
 */
export function localKerrNullStep(
  pos: Vec3,
  dir: Vec3,
  mass: number,
  spinChi: number,
  dLambda: number,
): { pos: Vec3; dir: Vec3 } {
  const M = Math.max(1e-4, mass);
  const chi = clampSpin(spinChi);
  const a = chi * M;
  const r = Math.max(len(pos), 1e-4);
  const rHat = norm(pos);
  const dHat = norm(dir);

  // Leading light deflection (weak-field null)
  const bend = scale(rHat, (-2 * M * dLambda) / (r * r));

  // Lense–Thirring–like drag on the ray direction (spin along +Y)
  const spinAxis: Vec3 = [0, 1, 0];
  const drag = scale(
    cross(spinAxis, dHat),
    ((2 * a * M) / (r * r * r)) * dLambda,
  );

  let newDir = norm(add(add(dHat, bend), drag));
  const newPos = add(pos, scale(newDir, dLambda));
  return { pos: newPos, dir: newDir };
}

/** Soft weight for hole i when blending two local Kerr charts. */
export function chartWeight(r: number, otherR: number, power = 3): number {
  const a = 1 / Math.pow(Math.max(r, 1e-3), power);
  const b = 1 / Math.pow(Math.max(otherR, 1e-3), power);
  return a / (a + b);
}
