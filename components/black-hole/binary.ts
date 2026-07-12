/**
 * Newtonian binary kinematics (geometric units) for the banner.
 * Pure — no React / GPU. Centers orbit in the XZ plane.
 *
 * @module components/black-hole/binary
 */

/** Circular two-body mean motion Ω = √(M_tot / d³). */
export function binaryOrbitalOmega(
  totalMass: number,
  separation: number,
): number {
  const M = Math.max(totalMass, 1e-8);
  const d = Math.max(separation, 1e-3);
  return Math.sqrt(M / d ** 3);
}

/**
 * Barycentric arm lengths for circular binary:
 * r₁ = d · M₂ / M_tot, r₂ = d · M₁ / M_tot (lighter hole farther out).
 */
export function binaryArmLengths(
  separation: number,
  primaryMass: number,
  secondaryMass: number,
): { arm1: number; arm2: number; totalMass: number } {
  const m1 = Math.max(primaryMass, 1e-8);
  const m2 = Math.max(secondaryMass, 1e-8);
  const totalMass = m1 + m2;
  const d = Math.max(separation, 1e-3);
  return {
    arm1: (d * m2) / totalMass,
    arm2: (d * m1) / totalMass,
    totalMass,
  };
}

/**
 * World position of hole centers at phase φ (y = 0 midplane).
 * Primary at −arm1 (cos φ, 0, sin φ), secondary opposite.
 */
export function binaryHolePositions(
  phase: number,
  arm1: number,
  arm2: number,
): {
  pos1: readonly [number, number, number];
  pos2: readonly [number, number, number];
} {
  const c = Math.cos(phase);
  const s = Math.sin(phase);
  return {
    pos1: [-c * arm1, 0, -s * arm1],
    pos2: [c * arm2, 0, s * arm2],
  };
}

/** Separation between centers should equal d (within float error). */
export function holeCenterSeparation(
  pos1: readonly [number, number, number],
  pos2: readonly [number, number, number],
): number {
  return Math.hypot(pos1[0] - pos2[0], pos1[1] - pos2[1], pos1[2] - pos2[2]);
}
