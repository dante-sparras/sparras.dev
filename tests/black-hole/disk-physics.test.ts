/**
 * Disk temperature, Doppler, and intensity transforms.
 * Run: bun test tests/black-hole
 */
import { describe, expect, test } from "bun:test";
import { keplerOmega } from "../../components/black-hole/physics/kerr";
import {
  circularOrbitalBeta,
  diskDopplerG,
  diskTemperatureK,
  gravitationalRedshift,
  intensityDopplerWeight,
  kerrCircularOmega,
  specialRelDopplerG,
} from "../../components/black-hole/physics/disk";

describe("diskTemperatureK", () => {
  test("at r_in equals peak kelvin", () => {
    expect(diskTemperatureK(6, 6, 48, 0.75)).toBeCloseTo(48_000, 6);
  });
  test("falls as (rin/r)^α", () => {
    const t = diskTemperatureK(12, 6, 48, 0.75);
    expect(t).toBeCloseTo(48_000 * Math.pow(0.5, 0.75), 4);
  });
  test("r below rin clamps to rin", () => {
    expect(diskTemperatureK(1, 6, 48, 0.75)).toBeCloseTo(48_000, 6);
  });
  test("alpha clamp to [0.5, 1.5]", () => {
    const lo = diskTemperatureK(12, 6, 40, 0.1);
    const hi = diskTemperatureK(12, 6, 40, 9);
    expect(lo).toBeCloseTo(diskTemperatureK(12, 6, 40, 0.5), 6);
    expect(hi).toBeCloseTo(diskTemperatureK(12, 6, 40, 1.5), 6);
  });
});

describe("kerrCircularOmega", () => {
  test("aliases keplerOmega", () => {
    expect(kerrCircularOmega(8, 1, 0.2)).toBeCloseTo(
      keplerOmega(8, 1, 0.2),
      12,
    );
  });
});

describe("circularOrbitalBeta", () => {
  test("at r=6M Schwarzschild is below c", () => {
    const b = circularOrbitalBeta(6, 1, 0);
    expect(b).toBeGreaterThan(0.1);
    expect(b).toBeLessThan(0.85);
    expect(b).toBeCloseTo(keplerOmega(6, 1, 0) * 6, 5);
  });
  test("never exceeds hard cap 0.85", () => {
    expect(circularOrbitalBeta(1.2, 1, 0.998)).toBeLessThanOrEqual(0.85);
  });
});

describe("gravitationalRedshift", () => {
  test("→ 1 at large r", () => {
    expect(gravitationalRedshift(1e6, 1, 0)).toBeCloseTo(1, 5);
  });
  test("smaller nearer the hole", () => {
    const near = gravitationalRedshift(4, 1, 0);
    const far = gravitationalRedshift(40, 1, 0);
    expect(near).toBeLessThan(far);
    expect(near).toBeGreaterThan(0);
  });
  test("floors outside horizon", () => {
    const g = gravitationalRedshift(0.1, 1, 0);
    expect(g).toBeGreaterThanOrEqual(0.01);
    expect(Number.isFinite(g)).toBe(true);
  });
});

describe("specialRelDopplerG", () => {
  test("rest frame is 1", () => {
    expect(specialRelDopplerG(0, 0)).toBeCloseTo(1, 6);
  });
  test("approaching (μ>0) > receding (μ<0)", () => {
    expect(specialRelDopplerG(0.3, 0.8)).toBeGreaterThan(
      specialRelDopplerG(0.3, -0.8),
    );
  });
  test("extreme approach grows without SR-only hard cap (diskDopplerG clamps)", () => {
    const raw = specialRelDopplerG(0.85, 0.999);
    expect(raw).toBeGreaterThan(1);
    expect(Number.isFinite(raw)).toBe(true);
    // Combined path clamps
    expect(
      diskDopplerG({ r: 8, mass: 1, spinChi: 0, mu: 0.999 }),
    ).toBeLessThanOrEqual(2.5);
  });
});

describe("diskDopplerG", () => {
  test("face-on-ish mu=0 is near gravitational only", () => {
    const g = diskDopplerG({ r: 8, mass: 1, spinChi: 0, mu: 0 });
    expect(g).toBeGreaterThan(0.3);
    expect(g).toBeLessThan(1.1);
  });
  test("approaching limb larger g than receding", () => {
    const up = diskDopplerG({ r: 8, mass: 1, spinChi: 0.3, mu: 0.7 });
    const down = diskDopplerG({ r: 8, mass: 1, spinChi: 0.3, mu: -0.7 });
    expect(up).toBeGreaterThan(down);
  });
  test("clamped to [0.3, 2.5]", () => {
    const g = diskDopplerG({ r: 3, mass: 1, spinChi: 0.9, mu: 1 });
    expect(g).toBeGreaterThanOrEqual(0.3);
    expect(g).toBeLessThanOrEqual(2.5);
  });
});

describe("intensityDopplerWeight", () => {
  test("is g³", () => {
    expect(intensityDopplerWeight(2)).toBeCloseTo(8, 6);
    expect(intensityDopplerWeight(1)).toBeCloseTo(1, 6);
  });
  test("respects clamp of g", () => {
    expect(intensityDopplerWeight(10)).toBeCloseTo(2.5 ** 3, 6);
    expect(intensityDopplerWeight(0.01)).toBeCloseTo(0.3 ** 3, 6);
  });
});
