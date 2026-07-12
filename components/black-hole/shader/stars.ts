// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/**
 * Grid-based procedural stars (dgreenheck) + light AA for lensed rays.
 * One star per cell; 3×3 neighborhood so edges don't clip.
 */

import type { BlackHoleUniforms } from "../mesh";
import {
  vec2,
  vec3,
  float,
  Fn,
  atan,
  asin,
  clamp,
  max,
  floor,
  length,
  smoothstep,
  step,
  mix,
  fwidth,
} from "three/tsl";
import { hash21, hash22 } from "./noise";

export const createStarField = (uniforms: BlackHoleUniforms) =>
  Fn(([rayDir]) => {
    const theta = atan(rayDir.z, rayDir.x);
    const phi = asin(clamp(rayDir.y, float(-1.0), float(1.0)));

    const gridScale = float(60.0).div(max(uniforms.starSize, float(0.25)));
    const scaled = vec2(theta, phi).mul(gridScale);
    const baseCell = floor(scaled);

    // Widen kernels when angular density is high (near critical lensing)
    const angW = max(fwidth(theta), fwidth(phi)).mul(gridScale);
    const soft = clamp(float(1.0).add(angW.mul(6.0)), float(1.0), float(4.0));

    const acc = vec3(0.0, 0.0, 0.0).toVar("starAcc");

    for (const ox of [-1, 0, 1]) {
      for (const oy of [-1, 0, 1]) {
        const cell = baseCell.add(vec2(ox, oy));
        const cellUV = scaled.sub(cell);

        const cellHash = hash21(cell);
        const alive = step(float(1.0).sub(uniforms.starDensity), cellHash);

        const starPos = hash22(cell.add(42.0)).mul(0.8).add(0.1);
        const dist = length(cellUV.sub(starPos));

        const size = hash21(cell.add(100.0))
          .mul(0.03)
          .add(0.01)
          .mul(uniforms.starSize)
          .mul(soft);

        const core = smoothstep(size, float(0.0), dist);
        const glow = smoothstep(size.mul(3.0), float(0.0), dist).mul(0.3);
        const intensity = core.add(glow).mul(alive);

        const temp = hash21(cell.add(200.0));
        const col = mix(vec3(0.8, 0.9, 1.0), vec3(1.0, 0.95, 0.8), temp)
          .mul(uniforms.starTint.xyz)
          .mul(uniforms.starTint.w);

        acc.addAssign(col.mul(intensity).mul(uniforms.starBrightness));
      }
    }

    return acc;
  });
