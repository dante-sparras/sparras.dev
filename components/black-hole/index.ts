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
export type { BlackHoleOverrides, BlackHoleConfig, KerrScales } from "./config";
export {
  defaultPhysics,
  defaultRender,
  buildBlackHoleConfig,
  cameraPositionFromObserver,
  CAMERA_FOV_DEG,
  orbitDistanceLimits,
  skyDomeRadius,
  kerrScales,
  keplerOmega,
} from "./config";
