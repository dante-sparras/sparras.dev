// @ts-nocheck
// Three.js TSL Fn() bodies are not accurately typed.

/**
 * Absolute Kelvin → Interstellar peach RGB (never pure white).
 * Keep stops aligned with components/black-hole/blackbody.ts.
 */

import { vec3, float, Fn, max, log, pow, mix, clamp } from "three/tsl";

const unitRange = Fn(([x, a, b]) => {
  return clamp(x.sub(a).div(max(b.sub(a), float(1e-3))), float(0), float(1));
});

/**
 * temperatureToDiskColor(kelvin) — primary hue driver for mini-disks.
 */
export const temperatureToDiskColor = Fn(([kelvin]) => {
  const t = max(kelvin, float(1));
  const lo = float(Math.log(8000));
  const hi = float(Math.log(80000));
  const heat = clamp(
    log(t)
      .sub(lo)
      .div(max(hi.sub(lo), float(1e-6))),
    float(0),
    float(1),
  );
  const s = pow(heat, float(1.25));

  const coolRust = vec3(0.45, 0.04, 0.01);
  const deepRed = vec3(0.7, 0.05, 0.0);
  const fireRed = vec3(0.95, 0.14, 0.01);
  const orange = vec3(1.0, 0.32, 0.04);
  const amber = vec3(1.0, 0.48, 0.08);
  const hotPeach = vec3(1.0, 0.58, 0.12); // never white

  const c0 = mix(coolRust, deepRed, unitRange(s, float(0), float(0.25)));
  const c1 = mix(deepRed, fireRed, unitRange(s, float(0.25), float(0.45)));
  const c2 = mix(fireRed, orange, unitRange(s, float(0.45), float(0.65)));
  const c3 = mix(orange, amber, unitRange(s, float(0.65), float(0.85)));
  const c4 = mix(amber, hotPeach, unitRange(s, float(0.85), float(1)));

  const midA = mix(c0, c1, unitRange(s, float(0.15), float(0.4)));
  const midB = mix(c2, c3, unitRange(s, float(0.5), float(0.75)));
  const mid = mix(midA, midB, unitRange(s, float(0.35), float(0.7)));
  return clamp(
    mix(mid, c4, unitRange(s, float(0.75), float(1))),
    float(0),
    float(1),
  );
});
