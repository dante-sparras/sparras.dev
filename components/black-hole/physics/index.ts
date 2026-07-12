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
  PHYSICS_LIMITS,
  binaryVisualExtent,
  cameraPositionFromObserver,
  clampInclinationDegrees,
  orbitDistanceLimits,
  skyDomeRadius,
} from "./config";

// Deep imports for tests / advanced use:
//   ./kerr  ./binary  ./disk  ./blackbody  ./geodesic  ./limits  ./observer
