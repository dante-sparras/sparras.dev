// @ts-nocheck
// Three.js TSL Fn() bodies are not accurately typed.

/**
 * Shared TSL unit remap — single definition for disk + blackbody.
 */
import { float, Fn, max, clamp } from "three/tsl";

/** Remap x from [a, b] → [0, 1] with hard clamp. */
export const unitRange = Fn(([x, a, b]) => {
  return clamp(x.sub(a).div(max(b.sub(a), float(1e-3))), float(0), float(1));
});
