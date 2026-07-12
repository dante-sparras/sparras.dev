/**
 * Public API — binary black-hole simulation (client components only).
 *
 * From a Server Component use `HeroBanner` in `@/components/hero-section`.
 *
 * ```ts
 * <BlackHole spin={0.9} inclination={135} />
 * buildBlackHoleConfig({ separation: 16 })
 * ```
 */

export { BlackHole, type BlackHoleProps, SHELL_CLASS } from "./black-hole";
export {
  buildBlackHoleConfig,
  defaultPhysics,
  defaultRender,
  pickPhysics,
  type BlackHoleConfig,
  type PhysicsParams,
  type RawPhysics,
  type RawPhysicsKey,
  RAW_PHYSICS_KEYS,
} from "./physics";
