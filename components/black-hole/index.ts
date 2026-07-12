/**
 * Public API — binary black-hole simulation (client components only).
 *
 * Layout: parent sizes the box; `<BlackHole />` fills it (`h-full w-full`).
 *
 * From a Server Component for the **home hero**, use `HeroBanner`
 * in `@/components/hero-section` (banner flex / min-height live there).
 *
 * ```ts
 * <div className="h-64 w-full"><BlackHole spin={0.9} /></div>
 * buildBlackHoleConfig({ separation: 16 })
 * ```
 */

export { BlackHole, type BlackHoleProps } from "./black-hole";
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
