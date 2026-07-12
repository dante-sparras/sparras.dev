/**
 * Kerr / Schwarzschild length-scale tests.
 * Run: bun test tests/black-hole
 */
import { describe, expect, test } from "bun:test";
import {
  clampSpin,
  iscoRadius,
  keplerOmega,
  kerrScales,
  photonSphereRadius,
} from "../../components/black-hole/physics/kerr";

describe("clampSpin", () => {
  test("passes through interior values", () => {
    expect(clampSpin(0.35)).toBe(0.35);
    expect(clampSpin(-0.5)).toBe(-0.5);
  });
  test("clamps to open interval and rejects non-finite", () => {
    expect(clampSpin(2)).toBe(0.998);
    expect(clampSpin(-2)).toBe(-0.998);
    expect(clampSpin(Number.NaN)).toBe(0);
    expect(clampSpin(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("photonSphereRadius", () => {
  test("Schwarzschild χ=0 → 3M (both branches)", () => {
    expect(photonSphereRadius(1, 0, true)).toBeCloseTo(3, 5);
    expect(photonSphereRadius(1, 0, false)).toBeCloseTo(3, 5);
    expect(photonSphereRadius(2, 0, true)).toBeCloseTo(6, 5);
  });
  test("prograde shrinks toward M as χ→1; retrograde grows toward 4M", () => {
    const pro = photonSphereRadius(1, 0.998, true);
    const ret = photonSphereRadius(1, 0.998, false);
    expect(pro).toBeLessThan(3);
    expect(pro).toBeGreaterThan(1);
    expect(ret).toBeGreaterThan(3);
    expect(ret).toBeLessThan(4.01);
  });
  test("spin sign ignored; branch from prograde flag", () => {
    expect(photonSphereRadius(1, 0.5, true)).toBeCloseTo(
      photonSphereRadius(1, -0.5, true),
      10,
    );
  });
});

describe("iscoRadius", () => {
  test("Schwarzschild χ=0 → 6M both branches", () => {
    expect(iscoRadius(1, 0, true)).toBeCloseTo(6, 6);
    expect(iscoRadius(1, 0, false)).toBeCloseTo(6, 6);
    expect(iscoRadius(3, 0, true)).toBeCloseTo(18, 5);
  });
  test("prograde ISCO < retrograde for high spin", () => {
    const pro = iscoRadius(1, 0.9, true);
    const ret = iscoRadius(1, 0.9, false);
    expect(pro).toBeLessThan(ret);
    expect(pro).toBeLessThan(6);
    expect(ret).toBeGreaterThan(6);
  });
  test("near-extremal prograde ISCO approaches ~M", () => {
    const pro = iscoRadius(1, 0.998, true);
    expect(pro).toBeLessThan(1.5);
    expect(pro).toBeGreaterThan(1);
  });
});

describe("kerrScales", () => {
  test("Schwarzschild (χ=0): r₊=2M, photon≈3M, ISCO≈6M", () => {
    const s = kerrScales(1, 0);
    expect(s.eventHorizon).toBeCloseTo(2, 6);
    expect(s.photonSphere).toBeCloseTo(3, 5);
    expect(s.iscoPrograde).toBeCloseTo(6, 5);
    expect(s.iscoRetrograde).toBeCloseTo(6, 5);
    expect(s.schwarzschildRadius).toBe(2);
    expect(s.eventHorizonInner).toBeCloseTo(0, 6);
    expect(s.a).toBe(0);
    expect(s.spin).toBe(0);
  });

  test("horizons r₊ = M(1+√(1-χ²)), r₋ = M(1-√(1-χ²))", () => {
    const chi = 0.6;
    const s = kerrScales(1, chi);
    const disc = Math.sqrt(1 - chi * chi);
    expect(s.eventHorizon).toBeCloseTo(1 + disc, 8);
    expect(s.eventHorizonInner).toBeCloseTo(1 - disc, 8);
    expect(s.a).toBeCloseTo(chi, 8);
  });

  test("high spin shrinks prograde ISCO and outer horizon toward M", () => {
    const s = kerrScales(1, 0.998);
    expect(s.eventHorizon).toBeLessThan(1.1);
    expect(s.eventHorizon).toBeGreaterThan(0.9);
    expect(s.iscoPrograde).toBeLessThan(2);
    expect(s.iscoPrograde).toBeGreaterThan(1);
    expect(s.photonSphere).toBeLessThan(s.iscoPrograde + 0.5);
    expect(s.iscoRetrograde).toBeGreaterThan(s.iscoPrograde);
  });

  test("scales linearly with mass", () => {
    const a = kerrScales(2, 0);
    expect(a.eventHorizon).toBeCloseTo(4, 6);
    expect(a.iscoPrograde).toBeCloseTo(12, 5);
    expect(a.photonSphere).toBeCloseTo(6, 5);
  });

  test("tiny mass floored", () => {
    const s = kerrScales(0, 0);
    expect(s.mass).toBeGreaterThan(0);
    expect(s.eventHorizon).toBeGreaterThan(0);
  });
});

describe("keplerOmega", () => {
  test("Schwarzschild circular orbit at r=6M", () => {
    const omega = keplerOmega(6, 1, 0);
    expect(omega).toBeCloseTo(1 / Math.pow(6, 1.5), 8);
  });
  test("prograde a>0 decreases Ω at fixed r (Bardeen formula)", () => {
    // Ω = 1 / (r^{3/2}/√M + a) — positive a enlarges denominator
    const o0 = keplerOmega(6, 1, 0);
    const oS = keplerOmega(6, 1, 0.5);
    expect(oS).toBeLessThan(o0);
    expect(oS).toBeCloseTo(1 / (Math.pow(6, 1.5) + 0.5), 8);
  });
  test("larger radius → smaller Ω", () => {
    expect(keplerOmega(10, 1, 0)).toBeLessThan(keplerOmega(6, 1, 0));
  });
});
