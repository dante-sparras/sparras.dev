/**
 * Pure physics / config tests (no WebGPU).
 * Run: bun test tests
 */
import { describe, expect, test } from "bun:test";
import {
  buildBlackHoleConfig,
  defaultPhysics,
  orbitDistanceLimits,
  skyDomeRadius,
} from "@/components/black-hole/config";
import {
  clampSpin,
  keplerOmega,
  kerrScales,
} from "@/components/black-hole/kerr";

describe("clampSpin", () => {
  test("passes through interior values", () => {
    expect(clampSpin(0.35)).toBe(0.35);
  });
  test("clamps to open interval and rejects non-finite", () => {
    expect(clampSpin(2)).toBe(0.998);
    expect(clampSpin(-2)).toBe(-0.998);
    expect(clampSpin(Number.NaN)).toBe(0);
  });
});

describe("kerrScales", () => {
  test("Schwarzschild (χ=0): r₊=2M, photon≈3M, ISCO≈6M", () => {
    const s = kerrScales(1, 0);
    expect(s.eventHorizon).toBeCloseTo(2, 6);
    expect(s.photonSphere).toBeCloseTo(3, 5);
    expect(s.iscoPrograde).toBeCloseTo(6, 5);
    expect(s.schwarzschildRadius).toBe(2);
    expect(s.eventHorizonInner).toBeCloseTo(0, 6);
  });

  test("high spin shrinks prograde ISCO and outer horizon toward M", () => {
    const s = kerrScales(1, 0.998);
    expect(s.eventHorizon).toBeLessThan(1.1);
    expect(s.eventHorizon).toBeGreaterThan(0.9);
    expect(s.iscoPrograde).toBeLessThan(2);
    expect(s.iscoPrograde).toBeGreaterThan(1);
    expect(s.photonSphere).toBeLessThan(s.iscoPrograde + 0.5);
  });

  test("scales linearly with mass", () => {
    const a = kerrScales(2, 0);
    expect(a.eventHorizon).toBeCloseTo(4, 6);
    expect(a.iscoPrograde).toBeCloseTo(12, 5);
  });
});

describe("keplerOmega", () => {
  test("Schwarzschild circular orbit at r=6M", () => {
    // Ω = 1 / (r^{3/2}/√M) = √M / r^{3/2} for a=0
    const omega = keplerOmega(6, 1, 0);
    expect(omega).toBeCloseTo(1 / Math.pow(6, 1.5), 8);
  });
});

describe("orbitDistanceLimits / skyDomeRadius", () => {
  test("sky shell stays outside max zoom", () => {
    for (const d of [12, 28, 50, 100]) {
      const { max } = orbitDistanceLimits(d);
      expect(skyDomeRadius(max)).toBeGreaterThanOrEqual(max);
      expect(skyDomeRadius(max)).toBeGreaterThanOrEqual(80);
    }
  });
});

describe("buildBlackHoleConfig", () => {
  test("defaults produce finite dual-hole scales", () => {
    const c = buildBlackHoleConfig();
    expect(c.primaryMass).toBe(defaultPhysics.primaryMass);
    expect(c.secondaryMass).toBeCloseTo(
      defaultPhysics.primaryMass * defaultPhysics.massRatio,
      8,
    );
    expect(c.eventHorizonPrimary).toBeGreaterThan(0);
    expect(c.eventHorizonSecondary).toBeGreaterThan(0);
    expect(c.diskScaleHeightPrimary).toBeGreaterThan(0);
    expect(c.diskScaleHeightSecondary).toBeGreaterThan(0);
    expect(c.orbitalFrequency).toBeGreaterThan(0);
    expect(Number.isFinite(c.spin)).toBe(true);
  });

  test("large separation raises camera for FOV fit without proportional lock", () => {
    const c = buildBlackHoleConfig({
      overrides: { separation: 40, cameraDistance: 28 },
    });
    // FOV fit: max(base, sep*1.55+4, 12)
    expect(c.cameraDistance).toBeGreaterThanOrEqual(40 * 1.55 + 4);
    // Angular gap still grows: sep/D should be larger than default sep/D
    const def = buildBlackHoleConfig();
    expect(c.separation / c.cameraDistance).toBeGreaterThan(
      (def.separation / def.cameraDistance) * 0.5,
    );
  });

  test("mass ratio yields different per-hole scale heights", () => {
    const c = buildBlackHoleConfig({
      overrides: { massRatio: 0.3 },
    });
    expect(c.diskScaleHeightSecondary).toBeLessThan(c.diskScaleHeightPrimary);
    expect(c.iscoSecondary).toBeLessThan(c.iscoPrimary);
  });

  test("light theme dims accretion when themeColors enabled", () => {
    const dark = buildBlackHoleConfig({
      themeColors: true,
      mode: "dark",
      overrides: { accretionRate: 10 },
    });
    const light = buildBlackHoleConfig({
      themeColors: true,
      mode: "light",
      overrides: { accretionRate: 10 },
    });
    expect(light.accretionRate).toBeCloseTo(dark.accretionRate * 0.55, 8);
  });
});
