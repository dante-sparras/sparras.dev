// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/** Two-layer FBM nebula (dgreenheck) with theme color × alpha. */

import type { BlackHoleUniforms } from "../mesh";
import { float, Fn, clamp } from "three/tsl";
import { fbm } from "./noise";

export const createNebulaField = (uniforms: BlackHoleUniforms) =>
  Fn(([rayDir]) => {
    const n1 = fbm(rayDir.mul(uniforms.nebula1Scale), float(2.0), float(0.5))
      .mul(2.0)
      .sub(1.0);
    const layer1 = clamp(
      n1.add(uniforms.nebula1Density),
      float(0.0),
      float(1.0),
    );
    const c1 = uniforms.nebula1Color.xyz
      .mul(uniforms.nebula1Color.w)
      .mul(layer1);

    const n2 = fbm(rayDir.mul(uniforms.nebula2Scale), float(2.0), float(0.5))
      .mul(2.0)
      .sub(1.0);
    const layer2 = clamp(
      n2.add(uniforms.nebula2Density),
      float(0.0),
      float(1.0),
    );
    const c2 = uniforms.nebula2Color.xyz
      .mul(uniforms.nebula2Color.w)
      .mul(layer2);

    return c1.add(c2);
  });
