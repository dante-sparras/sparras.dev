/**
 * Public API — binary black-hole simulation (client components only).
 *
 * From a Server Component use `HeroBanner` in `@/components/hero-section`.
 *
 * Configure with flat knobs or `physics` bag only:
 * ```ts
 * <BlackHole spin={0.9} inclination={135} />
 * buildBlackHoleConfig({ separation: 16 })
 * ```
 */

export { BlackHole, type BlackHoleProps, SHELL_CLASS } from "./black-hole";
export type {
  BlackHoleOverrides,
  BlackHoleConfig,
  KerrScales,
  RawBlackHolePhysics,
  RawPhysicsKey,
  BuildBlackHoleConfigOptions,
} from "./config";
export {
  defaultPhysics,
  defaultRender,
  buildBlackHoleConfig,
  cameraPositionFromObserver,
  clampInclinationDegrees,
  CAMERA_FOV_DEG,
  orbitDistanceLimits,
  skyDomeRadius,
  binaryVisualExtent,
  withLightThemeAccretion,
  RAW_PHYSICS_KEYS,
  pickPhysicsOverrides,
  mergePhysicsOverrides,
  resolvePhysics,
  physicsOverridesKey,
  PHYSICS_LIMITS,
  DOPPLER_LIMITS,
  PALETTE_LIMITS,
  SPIN_LIMITS,
  CAMERA,
} from "./config";
export {
  diskTemperatureK,
  diskDopplerG,
  intensityDopplerWeight,
} from "./disk-physics";
export { temperatureToDiskColor } from "./blackbody";
export {
  binaryOrbitalOmega,
  binaryArmLengths,
  binaryHolePositions,
} from "./binary";
