// @ts-nocheck
// Three.js TSL Fn() bodies are not accurately typed.

/**
 * Absolute Kelvin → Interstellar peach RGB (never pure white).
 * Stops/limits aligned with physics/blackbody.ts + limits.ts.
 */

import { vec3, float, Fn, max, log, pow, mix, clamp } from "three/tsl";
import {
  HOT_PEACH,
  AMBER,
  ORANGE,
  FIRE_RED,
  DEEP_RED,
  COOL_RUST,
} from "../physics/blackbody";
import { PALETTE_LIMITS } from "../physics/limits";

/** Remap x from [a, b] → [0, 1] with hard clamp. */
const unitRange = Fn(([x, a, b]) => {
  return clamp(x.sub(a).div(max(b.sub(a), float(1e-3))), float(0), float(1));
});

function rgb(v) {
  return vec3(v[0], v[1], v[2]);
}

/**
 * temperatureToDiskColor(kelvin) — primary hue driver for mini-disks.
 */
export const temperatureToDiskColor = Fn(([kelvin]) => {
  const t = max(kelvin, float(1));
  const lo = float(Math.log(PALETTE_LIMITS.coolFloorK));
  const hi = float(Math.log(PALETTE_LIMITS.hotCeilK));
  const heat = clamp(
    log(t)
      .sub(lo)
      .div(max(hi.sub(lo), float(1e-6))),
    float(0),
    float(1),
  );
  const s = pow(heat, float(PALETTE_LIMITS.heatPower));

  const coolRust = rgb(COOL_RUST);
  const deepRed = rgb(DEEP_RED);
  const fireRed = rgb(FIRE_RED);
  const orange = rgb(ORANGE);
  const amber = rgb(AMBER);
  const hotPeach = rgb(HOT_PEACH);

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
