// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/**
 * Mitchell Charity blackbody LUT (CIE 1931 → sRGB).
 * Source: http://www.vendian.org/mncharity/dir3/blackbody/
 * Same table as dgreenheck/webgpu-black-hole; sparse keypoints to keep the
 * WGSL graph smaller than the 100-step original while staying smooth.
 */

import { vec3, float, Fn, clamp, step, mix } from "three/tsl";

/** Key temperatures (K) → display RGB. Dense where the curve bends hardest. */
const LUT: readonly { t: number; c: readonly [number, number, number] }[] = [
  { t: 1000, c: [1, 0.0337, 0] },
  { t: 1500, c: [1, 0.1578, 0] },
  { t: 2000, c: [1, 0.2647, 0.0033] },
  { t: 2500, c: [1, 0.3814, 0.0588] },
  { t: 3000, c: [1, 0.487, 0.1411] },
  { t: 3500, c: [1, 0.5809, 0.2433] },
  { t: 4000, c: [1, 0.6636, 0.3583] },
  { t: 4500, c: [1, 0.736, 0.4803] },
  { t: 5000, c: [1, 0.7992, 0.6045] },
  { t: 5500, c: [1, 0.8541, 0.7277] },
  { t: 6000, c: [1, 0.9019, 0.8473] },
  { t: 6500, c: [1, 0.9436, 0.9621] },
  { t: 6700, c: [0.9937, 0.9526, 1] },
  { t: 7500, c: [0.852, 0.8621, 1] },
  { t: 8500, c: [0.7353, 0.7827, 1] },
  { t: 10000, c: [0.6268, 0.7039, 1] },
  { t: 15000, c: [0.4749, 0.5824, 1] },
  { t: 20000, c: [0.4196, 0.5339, 1] },
  { t: 30000, c: [0.3751, 0.4926, 1] },
  { t: 40000, c: [0.3563, 0.4745, 1] },
];

/** Temperature (K) → blackbody RGB via linear LUT interpolation. */
export const blackbodyColor = Fn(([tempK]) => {
  const temp = clamp(tempK, float(1000.0), float(40000.0));
  const r = float(0.0).toVar();
  const g = float(0.0).toVar();
  const b = float(0.0).toVar();

  for (let i = 0; i < LUT.length - 1; i++) {
    const tLow = float(LUT[i].t);
    const tHigh = float(LUT[i + 1].t);
    const inRange = step(tLow, temp).mul(step(temp, tHigh));
    const t = temp.sub(tLow).div(tHigh.sub(tLow));
    const c0 = LUT[i].c;
    const c1 = LUT[i + 1].c;

    r.addAssign(mix(float(c0[0]), float(c1[0]), t).mul(inRange));
    g.addAssign(mix(float(c0[1]), float(c1[1]), t).mul(inRange));
    b.addAssign(mix(float(c0[2]), float(c1[2]), t).mul(inRange));
  }

  return vec3(r, g, b);
});
