// @ts-nocheck
// Three.js TSL Fn() bodies are not accurately typed.

/**
 * Classic 4×4 Bayer ordered threshold in [0, 1).
 * Applied after color quantize for dithered pixel art.
 */

import { float, Fn, floor, fract, step, mix } from "three/tsl";

/**
 * Values are the standard Bayer matrix × 1/16, indexed by floor(pixel) mod 4.
 */
export const bayer4 = Fn(([px, py]) => {
  const x = floor(fract(px.div(4)).mul(4));
  const y = floor(fract(py.div(4)).mul(4));
  const odd = step(0.5, fract(x.mul(0.5)));
  const r0 = mix(
    mix(float(0), float(8), odd),
    mix(float(2), float(10), odd),
    step(1.5, x),
  );
  const r1 = mix(
    mix(float(12), float(4), odd),
    mix(float(14), float(6), odd),
    step(1.5, x),
  );
  const r2 = mix(
    mix(float(3), float(11), odd),
    mix(float(1), float(9), odd),
    step(1.5, x),
  );
  const r3 = mix(
    mix(float(15), float(7), odd),
    mix(float(13), float(5), odd),
    step(1.5, x),
  );
  const col = mix(
    mix(r0, r1, step(0.5, y)),
    mix(r2, r3, step(2.5, y)),
    step(1.5, y),
  );
  return col.add(0.5).div(16);
});
