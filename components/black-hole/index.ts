/**
 * Public API — binary black-hole simulation (client components only).
 *
 * ```
 * config.ts      physics knobs, defaults, Kerr scales, buildBlackHoleConfig
 * shader.ts      WebGPU/TSL raymarch
 * black-hole.tsx R3F host + mesh
 * ```
 *
 * From a Server Component use `HeroBanner` in `@/components/hero-section`.
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
  RAW_PHYSICS_KEYS,
  pickPhysicsOverrides,
  mergePhysicsOverrides,
  resolvePhysics,
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
