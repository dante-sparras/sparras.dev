/**
 * Binary black-hole fragment shader (WebGPU / Three.js TSL).
 *
 * Pipeline per pixel:
 * 1. Map UV (pixel art via low canvas DPR on the host)
 * 2. Cast a camera ray
 * 3. Raymarch: local Kerr bend, capture horizons, sample mini-disks
 * 4. Soft silhouettes
 * 5. Tonemap (fire red/orange, never solid yellow)
 * 6. Quantize + Bayer dither
 *
 * Units: G = c = 1.
 */

export { MARCH, DISK, GRADE } from "./constants";
export type { UniformNode, BlackHoleUniforms } from "./types";
export { CONFIG_SCALAR_KEYS } from "./types";
export { createBlackHoleShader } from "./create";
