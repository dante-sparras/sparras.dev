// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/** Procedural star field (3×3 cell neighborhood + soft kernels). */

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
  exp,
  step,
  mix,
} from "three/tsl";
import { hash21, hash22 } from "./noise";

// Procedural star field — 3×3 cell neighborhood + soft kernels
// (single-cell sampling + hard tips caused many stars to flicker while moving)
export const createStarField = (uniforms: BlackHoleUniforms) =>
  Fn(([rayDir]) => {
    const theta = atan(rayDir.z, rayDir.x);
    const phi = asin(clamp(rayDir.y, float(-1.0), float(1.0)));

    const gridScale = float(55.0).div(max(uniforms.starSize, float(0.35)));
    const scaledCoord = vec2(theta, phi).mul(gridScale);
    const baseCell = floor(scaledCoord);

    const acc = vec3(0.0, 0.0, 0.0).toVar("starAcc");

    // Unrolled 3×3 so stars near cell edges stay continuous across frames
    for (const ox of [-1, 0, 1]) {
      for (const oy of [-1, 0, 1]) {
        const cell = baseCell.add(vec2(ox, oy));
        // Local UV relative to this cell (not fract — correct for neighbors)
        const cellUV = scaledCoord.sub(cell);

        const cellHash = hash21(cell);
        const starProb = step(float(1.0).sub(uniforms.starDensity), cellHash);

        const starPos = hash22(cell.add(42.0)).mul(0.75).add(0.125);
        const distToStar = length(cellUV.sub(starPos));

        // Slightly larger + Gaussian falloff = less temporal aliasing
        const baseSizeVar = hash21(cell.add(100.0)).mul(0.028).add(0.014);
        const finalStarSize = baseSizeVar
          .mul(uniforms.starSize)
          .mul(1.2)
          .max(0.002);
        const d = distToStar.div(finalStarSize);
        const starCore = exp(d.mul(d).negate().mul(2.8));
        const starGlow = exp(d.mul(d).negate().mul(0.5)).mul(0.25);
        const starIntensity = starCore.add(starGlow).mul(starProb);

        const colorTemp = hash21(cell.add(200.0));
        const starColor = mix(
          vec3(0.92, 0.94, 1.0),
          vec3(1.0, 0.97, 0.92),
          colorTemp,
        )
          .mul(uniforms.starTint.xyz)
          .mul(uniforms.starTint.w);

        acc.addAssign(
          starColor.mul(starIntensity).mul(uniforms.starBrightness),
        );
      }
    }

    return acc;
  });
