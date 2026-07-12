/**
 * Observer pose, orbit zoom, and skydome sizing (geometric units).
 *
 * @module components/black-hole/physics/observer
 */

import { CAMERA, PHYSICS_LIMITS } from "./limits";

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
  extent = 0,
): { min: number; max: number } {
  const d = Math.max(PHYSICS_LIMITS.cameraDistanceMin, cameraDistance);
  const visual = Math.max(0, extent);
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
