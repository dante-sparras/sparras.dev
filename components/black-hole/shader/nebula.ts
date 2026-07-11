// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/** Two-layer FBM nebula (rgb × a × density). */

import type { BlackHoleUniforms } from "../mesh";
import { float, Fn, clamp } from "three/tsl";
import { fbm } from "./noise";

// Procedural nebula clouds - two FBM layers
export const createNebulaField = (uniforms: BlackHoleUniforms) =>
  Fn(([rayDir]) => {
    const noisePos1 = rayDir.mul(uniforms.nebula1Scale);
    const n1 = fbm(noisePos1, float(2.0), float(0.5)).mul(2.0).sub(1.0);
    const layer1 = clamp(
      n1.add(uniforms.nebula1Density),
      float(0.0),
      float(1.0),
    );
    // True color × alpha × density (supports #rrggbbaa e.g. border #ffffff1a)
    const color1 = uniforms.nebula1Color.xyz
      .mul(uniforms.nebula1Color.w)
      .mul(layer1);

    const noisePos2 = rayDir.mul(uniforms.nebula2Scale);
    const n2 = fbm(noisePos2, float(2.0), float(0.5)).mul(2.0).sub(1.0);
    const layer2 = clamp(
      n2.add(uniforms.nebula2Density),
      float(0.0),
      float(1.0),
    );
    const color2 = uniforms.nebula2Color.xyz
      .mul(uniforms.nebula2Color.w)
      .mul(layer2);

    return color1.add(color2);
  });
