// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/**
 * Hash / value-noise / FBM / cellular (Worley) for the black-hole disk.
 */

import {
  vec2,
  vec3,
  float,
  Fn,
  sin,
  dot,
  fract,
  floor,
  mix,
  min,
  max,
  length,
  clamp,
  pow,
} from "three/tsl";

export const hash21 = Fn(([p]) => {
  return fract(sin(dot(p, vec2(127.1, 311.7))).mul(43758.5453));
});

export const hash31 = Fn(([p]) => {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))).mul(43758.5453));
});

export const hash22 = Fn(([p]) => {
  const px = fract(sin(dot(p, vec2(127.1, 311.7))).mul(43758.5453));
  const py = fract(sin(dot(p, vec2(269.5, 183.3))).mul(43758.5453));
  return vec2(px, py);
});

/** 3D value noise with smoothstep-like interpolation. */
export const noise3D = Fn(([p]) => {
  const i = floor(p);
  const f = fract(p);
  const u = f.mul(f).mul(float(3.0).sub(f.mul(2.0)));

  const a = hash31(i);
  const b = hash31(i.add(vec3(1, 0, 0)));
  const c = hash31(i.add(vec3(0, 1, 0)));
  const d = hash31(i.add(vec3(1, 1, 0)));
  const e = hash31(i.add(vec3(0, 0, 1)));
  const f2 = hash31(i.add(vec3(1, 0, 1)));
  const g = hash31(i.add(vec3(0, 1, 1)));
  const h = hash31(i.add(vec3(1, 1, 1)));

  return mix(
    mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
    mix(mix(e, f2, u.x), mix(g, h, u.x), u.y),
    u.z,
  );
});

/** 4-octave FBM. */
export const fbm = Fn(([p, lacunarity, persistence]) => {
  const value = float(0.0).toVar();
  const amplitude = float(0.5).toVar();
  const pos = p.toVar();

  value.addAssign(noise3D(pos).mul(amplitude));
  pos.mulAssign(lacunarity);
  amplitude.mulAssign(persistence);

  value.addAssign(noise3D(pos).mul(amplitude));
  pos.mulAssign(lacunarity);
  amplitude.mulAssign(persistence);

  value.addAssign(noise3D(pos).mul(amplitude));
  pos.mulAssign(lacunarity);
  amplitude.mulAssign(persistence);

  value.addAssign(noise3D(pos).mul(amplitude));

  return value;
});

/**
 * 2D Worley — distance to nearest random feature point.
 */
export const cellular2D = Fn(([p]) => {
  const i = floor(p);
  const f = fract(p);
  const minD = float(8.0).toVar();

  for (const ox of [-1, 0, 1]) {
    for (const oy of [-1, 0, 1]) {
      const cell = i.add(vec2(ox, oy));
      const feature = hash22(cell);
      const offset = vec2(ox, oy).add(feature).sub(f);
      minD.assign(min(minD, length(offset)));
    }
  }
  return minD;
});

/**
 * Variable-size / variable-density cellular clouds.
 * Each cell: random radius, amplitude, and ~18–22% empty → chaotic packs.
 * Harder blob falloff so cores read against the dens floor (not a sheet).
 */
export const cellularClouds2D = Fn(
  ([p, sizeMin, sizeMax, densMin, densMax]) => {
    const i = floor(p);
    const f = fract(p);
    const acc = float(0.0).toVar();

    for (const ox of [-1, 0, 1]) {
      for (const oy of [-1, 0, 1]) {
        const cell = i.add(vec2(ox, oy));
        const feature = hash22(cell);
        const sz = mix(sizeMin, sizeMax, hash21(cell.add(17.0)));
        const dens = mix(densMin, densMax, hash21(cell.add(31.0)));
        // ~20% empty cells — irregular gaps between packs
        const live = clamp(
          hash21(cell.add(53.0)).sub(0.2).mul(35.0),
          float(0.0),
          float(1.0),
        );

        const offset = vec2(ox, oy).add(feature).sub(f);
        const d = length(offset).div(max(sz, float(0.12)));
        // Steeper falloff → harder cloud cores (less soft sheet)
        const blob = pow(
          clamp(float(1.0).sub(d), float(0.0), float(1.0)),
          float(1.85),
        );
        acc.addAssign(blob.mul(dens).mul(live));
      }
    }
    return clamp(acc, float(0.0), float(1.75));
  },
);
