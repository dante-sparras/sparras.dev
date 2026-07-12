/**
 * Temperature → Interstellar peach RGB.
 * Run: bun test tests/black-hole
 */
import { describe, expect, test } from "bun:test";
import {
  AMBER,
  assertNotWhitePlate,
  COOL_RUST,
  DEEP_RED,
  FIRE_RED,
  HOT_PEACH,
  ORANGE,
  temperatureHeat,
  temperatureToDiskColor,
} from "../../components/black-hole/blackbody";

describe("temperatureHeat", () => {
  test("increases with T", () => {
    expect(temperatureHeat(10_000)).toBeLessThan(temperatureHeat(50_000));
  });
  test("clamps outside [cool, hot] log window", () => {
    expect(temperatureHeat(100)).toBe(0);
    expect(temperatureHeat(1e9)).toBe(1);
  });
  test("mid-range interior", () => {
    const h = temperatureHeat(25_000);
    expect(h).toBeGreaterThan(0);
    expect(h).toBeLessThan(1);
  });
});

describe("temperatureToDiskColor", () => {
  test("cooler is redder (lower green) than hotter", () => {
    const cool = temperatureToDiskColor(12_000);
    const hot = temperatureToDiskColor(70_000);
    expect(cool[1]).toBeLessThan(hot[1]);
    expect(assertNotWhitePlate(cool)).toBe(true);
    expect(assertNotWhitePlate(hot)).toBe(true);
  });
  test("hot end is not white plate", () => {
    const hot = temperatureToDiskColor(100_000);
    expect(hot[2]).toBeLessThan(0.3);
    expect(hot[0]).toBeGreaterThan(0.9);
    expect(assertNotWhitePlate(hot)).toBe(true);
  });
  test("very cool approaches cool rust family", () => {
    const c = temperatureToDiskColor(8_000);
    expect(c[0]).toBeLessThan(0.8);
    expect(c[1]).toBeLessThan(0.15);
  });
  test("all components in [0,1]", () => {
    for (const T of [5_000, 15_000, 48_000, 80_000, 120_000]) {
      const [r, g, b] = temperatureToDiskColor(T);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(1);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(1);
    }
  });
  test("palette stops are not white", () => {
    for (const stop of [
      HOT_PEACH,
      AMBER,
      ORANGE,
      FIRE_RED,
      DEEP_RED,
      COOL_RUST,
    ]) {
      expect(assertNotWhitePlate(stop)).toBe(true);
    }
  });
});
