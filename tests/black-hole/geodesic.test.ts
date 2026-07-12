/**
 * Local Kerr null step + chart blending.
 * Run: bun test tests/black-hole
 */
import { describe, expect, test } from "bun:test";
import {
  chartWeight,
  localKerrNullStep,
} from "../../components/black-hole/kerr-geodesic";

function dirLen(d: readonly [number, number, number]): number {
  return Math.hypot(d[0], d[1], d[2]);
}

describe("localKerrNullStep", () => {
  test("deflects toward the mass (χ=0)", () => {
    const pos: [number, number, number] = [10, 0, 0];
    const dir: [number, number, number] = [0, 0, 1];
    const out = localKerrNullStep(pos, dir, 1, 0, 0.5);
    expect(out.dir[0]).toBeLessThan(0);
    expect(dirLen(out.dir)).toBeCloseTo(1, 5);
  });

  test("keeps direction unit length", () => {
    const out = localKerrNullStep([6, 1, 2], [0.2, 0.3, 0.9], 1, 0.4, 0.3);
    expect(dirLen(out.dir)).toBeCloseTo(1, 5);
  });

  test("spin changes drag direction vs χ=0", () => {
    const pos: [number, number, number] = [8, 0.5, 0];
    const dir: [number, number, number] = [0, 0, 1];
    const a0 = localKerrNullStep(pos, dir, 1, 0, 0.4);
    const aP = localKerrNullStep(pos, dir, 1, 0.9, 0.4);
    const aN = localKerrNullStep(pos, dir, 1, -0.9, 0.4);
    const diffP =
      Math.abs(a0.dir[0] - aP.dir[0]) +
      Math.abs(a0.dir[1] - aP.dir[1]) +
      Math.abs(a0.dir[2] - aP.dir[2]);
    expect(diffP).toBeGreaterThan(1e-4);
    // Opposite spin → drag not identical to +spin
    const diffPN =
      Math.abs(aP.dir[0] - aN.dir[0]) +
      Math.abs(aP.dir[1] - aN.dir[1]) +
      Math.abs(aP.dir[2] - aN.dir[2]);
    expect(diffPN).toBeGreaterThan(1e-4);
  });

  test("advances position along new direction", () => {
    const pos: [number, number, number] = [12, 0, 0];
    const dir: [number, number, number] = [0, 0, 1];
    const dl = 0.5;
    const out = localKerrNullStep(pos, dir, 1, 0, dl);
    const step = Math.hypot(
      out.pos[0] - pos[0],
      out.pos[1] - pos[1],
      out.pos[2] - pos[2],
    );
    expect(step).toBeCloseTo(dl, 4);
  });

  test("stronger mass bends more", () => {
    const pos: [number, number, number] = [10, 0, 0];
    const dir: [number, number, number] = [0, 0, 1];
    const light = localKerrNullStep(pos, dir, 0.5, 0, 0.5);
    const heavy = localKerrNullStep(pos, dir, 2, 0, 0.5);
    expect(Math.abs(heavy.dir[0])).toBeGreaterThan(Math.abs(light.dir[0]));
  });
});

describe("chartWeight", () => {
  test("favors nearer hole", () => {
    expect(chartWeight(2, 10)).toBeGreaterThan(0.5);
    expect(chartWeight(10, 2)).toBeLessThan(0.5);
  });
  test("equal radii → 0.5", () => {
    expect(chartWeight(5, 5)).toBeCloseTo(0.5, 10);
  });
  test("sums with swapped pair to 1", () => {
    const w = chartWeight(3, 7);
    const w2 = chartWeight(7, 3);
    expect(w + w2).toBeCloseTo(1, 10);
  });
});
