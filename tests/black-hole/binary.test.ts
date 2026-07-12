/**
 * Binary arms / phase positions.
 * Run: bun test tests/black-hole
 */
import { describe, expect, test } from "bun:test";
import {
  binaryArmLengths,
  binaryHolePositions,
  binaryOrbitalOmega,
  holeCenterSeparation,
} from "../../components/black-hole/physics/binary";

describe("binaryOrbitalOmega", () => {
  test("Ω = √(M/d³)", () => {
    expect(binaryOrbitalOmega(2, 8)).toBeCloseTo(Math.sqrt(2 / 8 ** 3), 10);
  });
  test("larger separation → slower orbit", () => {
    expect(binaryOrbitalOmega(1, 20)).toBeLessThan(binaryOrbitalOmega(1, 10));
  });
});

describe("binaryArmLengths", () => {
  test("equal mass → equal arms = d/2", () => {
    const { arm1, arm2 } = binaryArmLengths(12, 1, 1);
    expect(arm1).toBeCloseTo(6, 10);
    expect(arm2).toBeCloseTo(6, 10);
  });
  test("lighter secondary farther from CM (arm2 > arm1 when M2 < M1)", () => {
    // M1=1, M2=0.25 → arm1 = d*0.25/1.25, arm2 = d*1/1.25
    const { arm1, arm2, totalMass } = binaryArmLengths(10, 1, 0.25);
    expect(totalMass).toBeCloseTo(1.25, 10);
    expect(arm2).toBeGreaterThan(arm1);
    expect(arm1 + arm2).toBeCloseTo(10, 10);
  });
  test("arm1 + arm2 = separation", () => {
    const { arm1, arm2 } = binaryArmLengths(15, 0.8, 1.2);
    expect(arm1 + arm2).toBeCloseTo(15, 10);
  });
});

describe("binaryHolePositions", () => {
  test("centers stay separation d apart at any phase", () => {
    const d = 12;
    const { arm1, arm2 } = binaryArmLengths(d, 0.5, 0.5);
    for (const phase of [0, 0.7, Math.PI, 2.3, 4.1]) {
      const { pos1, pos2 } = binaryHolePositions(phase, arm1, arm2);
      expect(holeCenterSeparation(pos1, pos2)).toBeCloseTo(d, 8);
      expect(pos1[1]).toBe(0);
      expect(pos2[1]).toBe(0);
    }
  });
  test("phase 0 places holes on ±x for equal arms", () => {
    const { pos1, pos2 } = binaryHolePositions(0, 5, 5);
    expect(pos1[0]).toBeCloseTo(-5, 10);
    expect(pos2[0]).toBeCloseTo(5, 10);
    expect(pos1[2]).toBeCloseTo(0, 10);
    expect(pos2[2]).toBeCloseTo(0, 10);
  });
});
