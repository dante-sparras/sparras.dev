/**
 * Layout / camera constants shared by host + banner placeholder.
 * No Three/R3F imports — safe for the dynamic-loading chunk.
 */

/** Flex-safe shell: absolute canvas needs a real min-height. */
export const SHELL_CLASS =
  "relative min-h-[7.5rem] h-full w-full flex-1 bg-background sm:min-h-[9rem] md:min-h-[11rem]";

/** Hatch shown while hydrating or if WebGPU fails. */
export const FALLBACK_CLASS =
  "absolute inset-0 bg-[repeating-linear-gradient(45deg,var(--border)_0_1px,transparent_1px_10px)]";

export const ARIA_LABEL =
  "Interactive black hole — drag to orbit, scroll to zoom";

/** Profile-banner camera: inclined enough to see disk dome + secondary wrap. */
export const CAMERA = {
  fov: 48,
  near: 0.1,
  far: 1000,
  // ~25° from edge-on — not a pure side-on white bar
  position: [0, -7.5, 14] as [number, number, number],
};
