// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/**
 * Procedural star field (3×3 cell neighborhood + soft kernels).
 *
 * Anti-flicker for lensed rays:
 * - Screen-space fwidth on angular coords widens kernels when the look dir
 *   changes sharply across pixels / frames (photon-sphere chaos).
 * - Softer Gaussians so stars dissolve instead of popping when they jump cells.
 * - Stable per-star twinkle (hash phase × time) — no random noise flicker.
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
  exp,
  step,
  mix,
  sin,
  fwidth,
} from "three/tsl";
import { hash21, hash22 } from "./noise";

export const createStarField = (uniforms: BlackHoleUniforms) =>
  Fn(([rayDir]) => {
    const theta = atan(rayDir.z, rayDir.x);
    const phi = asin(clamp(rayDir.y, float(-1.0), float(1.0)));

    const gridScale = float(55.0).div(max(uniforms.starSize, float(0.35)));
    const scaledCoord = vec2(theta, phi).mul(gridScale);
    const baseCell = floor(scaledCoord);

    const angW = max(fwidth(theta), fwidth(phi)).mul(gridScale);
    const aaBoost = clamp(
      float(1.0).add(angW.mul(10.0)),
      float(1.0),
      float(5.0),
    );
    const coreSharp = mix(
      float(2.4),
      float(1.1),
      angW.mul(6.0).min(float(1.0)),
    );
    const glowSharp = mix(
      float(0.45),
      float(0.18),
      angW.mul(6.0).min(float(1.0)),
    );

    const acc = vec3(0.0, 0.0, 0.0).toVar("starAcc");

    for (const ox of [-1, 0, 1]) {
      for (const oy of [-1, 0, 1]) {
        const cell = baseCell.add(vec2(ox, oy));
        const cellUV = scaledCoord.sub(cell);

        const cellHash = hash21(cell);
        const starProb = step(float(1.0).sub(uniforms.starDensity), cellHash);

        const starPos = hash22(cell.add(42.0)).mul(0.75).add(0.125);
        const distToStar = length(cellUV.sub(starPos));

        const baseSizeVar = hash21(cell.add(100.0)).mul(0.028).add(0.014);
        const finalStarSize = baseSizeVar
          .mul(uniforms.starSize)
          .mul(1.35)
          .mul(aaBoost)
          .max(0.003);
        const d = distToStar.div(finalStarSize);
        const starCore = exp(d.mul(d).negate().mul(coreSharp));
        const starGlow = exp(d.mul(d).negate().mul(glowSharp)).mul(0.28);
        const starIntensity = starCore.add(starGlow).mul(starProb);

        // Stable twinkle: phase from cell hash, slow sine — not random sparkle
        const phase = hash21(cell.add(7.0)).mul(6.2831853);
        const rate = hash21(cell.add(13.0)).mul(1.8).add(0.55);
        const twinkle = sin(uniforms.time.mul(rate).add(phase))
          .mul(0.5)
          .add(0.5);
        // Bias bright most of the time; gentle dip
        const twinkleGain = mix(float(0.78), float(1.14), twinkle.mul(twinkle));

        const colorTemp = hash21(cell.add(200.0));
        const starColor = mix(
          vec3(0.92, 0.94, 1.0),
          vec3(1.0, 0.97, 0.92),
          colorTemp,
        )
          .mul(uniforms.starTint.xyz)
          .mul(uniforms.starTint.w);

        acc.addAssign(
          starColor
            .mul(starIntensity)
            .mul(uniforms.starBrightness)
            .mul(twinkleGain),
        );
      }
    }

    return acc;
  });
