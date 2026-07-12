/**
 * Pure physics package — Kerr, binary, disk, blackbody, geodesic, config.
 * @module components/black-hole/physics
 */

export {
  buildBlackHoleConfig,
  defaultPhysics,
  defaultRender,
  pickPhysics,
  resolvePhysics,
  RAW_PHYSICS_KEYS,
  type BlackHoleConfig,
  type PhysicsParams,
  type RawPhysics,
  type RawPhysicsKey,
  CAMERA,
  DOPPLER_LIMITS,
  PALETTE_LIMITS,
  PHYSICS_LIMITS,
  SPIN_LIMITS,
  binaryVisualExtent,
  cameraPositionFromObserver,
  clampInclinationDegrees,
  orbitDistanceLimits,
  skyDomeRadius,
} from "./config";
export {
  clampSpin,
  iscoRadius,
  keplerOmega,
  kerrScales,
  photonSphereRadius,
  type KerrScales,
} from "./kerr";
export {
  binaryArmLengths,
  binaryHolePositions,
  binaryOrbitalOmega,
} from "./binary";
export {
  circularOrbitalBeta,
  diskDopplerG,
  diskTemperatureK,
  gravitationalRedshift,
  intensityDopplerWeight,
  kerrCircularOmega,
  specialRelDopplerG,
} from "./disk";
export {
  AMBER,
  assertNotWhitePlate,
  COOL_RUST,
  DEEP_RED,
  FIRE_RED,
  HOT_PEACH,
  ORANGE,
  temperatureHeat,
  temperatureToDiskColor,
  type Rgb,
} from "./blackbody";
export { chartWeight, localKerrNullStep, type Vec3 } from "./geodesic";
