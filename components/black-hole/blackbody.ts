/**
 * Absolute temperature → Interstellar peach disk RGB (never pure white).
 * CPU reference — TSL port lives in shader/blackbody.ts (keep curves aligned).
 *
 * @module components/black-hole/blackbody
 */

export type Rgb = readonly [number, number, number];

/** Hot end of the fire palette — golden peach, not (1,1,1). */
export const HOT_PEACH: Rgb = [1.0, 0.58, 0.12];
export const AMBER: Rgb = [1.0, 0.48, 0.08];
export const ORANGE: Rgb = [1.0, 0.32, 0.04];
export const FIRE_RED: Rgb = [0.95, 0.14, 0.01];
export const DEEP_RED: Rgb = [0.7, 0.05, 0.0];
export const COOL_RUST: Rgb = [0.45, 0.04, 0.01];

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  const u = clamp01(t);
  return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
}

/**
 * Map absolute Kelvin to [0,1] heat using a soft log scale between
 * coolFloor and hotCeil (defaults cover thin-disk banner range).
 */
export function temperatureHeat(
  kelvin: number,
  coolFloorK = 8_000,
  hotCeilK = 80_000,
): number {
  const t = Math.max(kelvin, 1);
  const lo = Math.log(coolFloorK);
  const hi = Math.log(hotCeilK);
  return clamp01((Math.log(t) - lo) / Math.max(hi - lo, 1e-6));
}

/**
 * Temperature-driven Interstellar fire color.
 * Higher T → peach/gold core; lower T → deep red. Never pure white.
 */
export function temperatureToDiskColor(kelvin: number): Rgb {
  const h = temperatureHeat(kelvin);
  // Stretch: most of the range stays red/orange; only hottest tip is gold
  const s = Math.pow(h, 1.25);
  if (s < 0.25) {
    return mixRgb(COOL_RUST, DEEP_RED, s / 0.25);
  }
  if (s < 0.45) {
    return mixRgb(DEEP_RED, FIRE_RED, (s - 0.25) / 0.2);
  }
  if (s < 0.65) {
    return mixRgb(FIRE_RED, ORANGE, (s - 0.45) / 0.2);
  }
  if (s < 0.85) {
    return mixRgb(ORANGE, AMBER, (s - 0.65) / 0.2);
  }
  return mixRgb(AMBER, HOT_PEACH, (s - 0.85) / 0.15);
}

/** Hard guard — used in tests and optional post-pass. */
export function assertNotWhitePlate(rgb: Rgb, eps = 0.02): boolean {
  return !(rgb[0] > 1 - eps && rgb[1] > 1 - eps && rgb[2] > 1 - eps);
}
