/**
 * Pure disk / Doppler / blackbody / local Kerr step tests.
 * Run: bun test tests
 */
import { describe, expect, test } from "bun:test";
import {
  assertNotWhitePlate,
  temperatureHeat,
  temperatureToDiskColor,
} from "../../components/black-hole/blackbody";
import {
  circularOrbitalBeta,
  diskDopplerG,
  diskTemperatureK,
  intensityDopplerWeight,
  specialRelDopplerG,
} from "../../components/black-hole/disk-physics";
import {
  chartWeight,
  localKerrNullStep,
} from "../../components/black-hole/kerr-geodesic";
import { keplerOmega } from "../../components/black-hole/kerr";

describe("diskTemperatureK", () => {
  test("at r_in equals peak kelvin", () => {
    expect(diskTemperatureK(6, 6, 48, 0.75)).toBeCloseTo(48_000, 6);
  });
  test("falls as (rin/r)^α", () => {
    const t = diskTemperatureK(12, 6, 48, 0.75);
    expect(t).toBeCloseTo(48_000 * Math.pow(0.5, 0.75), 4);
  });
});

describe("diskDopplerG", () => {
  test("face-on-ish mu=0 is near gravitational only", () => {
    const g = diskDopplerG({ r: 8, mass: 1, spinChi: 0, mu: 0 });
    expect(g).toBeGreaterThan(0.3);
    expect(g).toBeLessThan(1.1);
  });
  test("approaching limb brighter (larger g) than receding", () => {
    const up = diskDopplerG({ r: 8, mass: 1, spinChi: 0.3, mu: 0.7 });
    const down = diskDopplerG({ r: 8, mass: 1, spinChi: 0.3, mu: -0.7 });
    expect(up).toBeGreaterThan(down);
  });
  test("intensity weight is g³", () => {
    expect(intensityDopplerWeight(2)).toBeCloseTo(8, 6);
  });
});

describe("specialRelDopplerG", () => {
  test("rest frame is ~1", () => {
    expect(specialRelDopplerG(0, 0)).toBeCloseTo(1, 6);
  });
});

describe("circularOrbitalBeta", () => {
  test("at r=6M Schwarzschild is below c", () => {
    const b = circularOrbitalBeta(6, 1, 0);
    expect(b).toBeGreaterThan(0.1);
    expect(b).toBeLessThan(0.85);
    expect(b).toBeCloseTo(keplerOmega(6, 1, 0) * 6, 5);
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
    expect(assertNotWhitePlate(hot)).toBe(true);
  });
  test("heat increases with T", () => {
    expect(temperatureHeat(10_000)).toBeLessThan(temperatureHeat(50_000));
  });
});

describe("localKerrNullStep", () => {
  test("deflects toward the mass (χ=0)", () => {
    const pos: [number, number, number] = [10, 0, 0];
    const dir: [number, number, number] = [0, 0, 1];
    const out = localKerrNullStep(pos, dir, 1, 0, 0.5);
    expect(out.dir[0]).toBeLessThan(0);
  });
  test("spin changes drag direction vs χ=0", () => {
    const pos: [number, number, number] = [8, 0.5, 0];
    const dir: [number, number, number] = [0, 0, 1];
    const a0 = localKerrNullStep(pos, dir, 1, 0, 0.4);
    const aP = localKerrNullStep(pos, dir, 1, 0.9, 0.4);
    const diff =
      Math.abs(a0.dir[0] - aP.dir[0]) +
      Math.abs(a0.dir[1] - aP.dir[1]) +
      Math.abs(a0.dir[2] - aP.dir[2]);
    expect(diff).toBeGreaterThan(1e-4);
  });
  test("chartWeight favors nearer hole", () => {
    expect(chartWeight(2, 10)).toBeGreaterThan(0.5);
  });
});
