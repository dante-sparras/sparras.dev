/**
 * Per-knob override coverage + flat DX.
 * Run: bun test tests/black-hole
 */
import { describe, expect, test } from "bun:test";
import {
  buildBlackHoleConfig,
  defaultPhysics,
  pickPhysics,
  RAW_PHYSICS_KEYS,
  resolvePhysics,
  type RawPhysicsKey,
} from "../../components/black-hole/physics";

const PROBE: Record<RawPhysicsKey, number> = {
  primaryMass: 0.42,
  secondaryMass: 0.33,
  separation: 17,
  spin: 0.72,
  inclination: 142,
  cameraDistance: 41,
  diskOuterRadiusM: 11,
  diskAspectRatio: 0.09,
  peakTemperature: 33,
  temperatureIndex: 0.85,
  accretionRate: 7.25,
};

describe("RAW_PHYSICS_KEYS", () => {
  test("covers every defaultPhysics field exactly once", () => {
    expect([...RAW_PHYSICS_KEYS].toSorted() as string[]).toEqual(
      Object.keys(defaultPhysics).toSorted(),
    );
  });
});

describe("pickPhysics", () => {
  test("ignores non-physics keys and non-finite numbers", () => {
    const picked = pickPhysics({
      spin: 0.5,
      className: "x",
      interactive: true,
      separation: Number.NaN,
      inclination: 90,
    } as never);
    expect(picked).toEqual({ spin: 0.5, inclination: 90 });
  });

  test("later sources win", () => {
    const m = pickPhysics(
      { spin: 0.1, separation: 10 },
      { spin: 0.9 },
      { inclination: 45 },
    );
    expect(m.spin).toBe(0.9);
    expect(m.separation).toBe(10);
    expect(m.inclination).toBe(45);
  });
});

describe("resolvePhysics", () => {
  test("empty → defaultPhysics", () => {
    expect(resolvePhysics()).toEqual({ ...defaultPhysics });
  });

  test("partial only changes that key", () => {
    const r = resolvePhysics({ spin: 0.11 });
    expect(r.spin).toBe(0.11);
    expect(r.separation).toBe(defaultPhysics.separation);
  });
});

describe("buildBlackHoleConfig — flat knobs", () => {
  test("flat knobs including both masses", () => {
    const c = buildBlackHoleConfig({
      primaryMass: 0.4,
      secondaryMass: 0.9,
      spin: 0.88,
      inclination: 135,
    });
    expect(c.primaryMass).toBeCloseTo(0.4, 5);
    expect(c.secondaryMass).toBeCloseTo(0.9, 5);
    expect(c.massRatio).toBeCloseTo(0.9 / 0.4, 5);
    expect(c.spin).toBeCloseTo(0.88, 5);
    expect(c.inclination).toBe(135);
  });
});

describe("buildBlackHoleConfig — each raw knob in isolation", () => {
  for (const key of RAW_PHYSICS_KEYS) {
    test(`override only ${key}`, () => {
      const probe = PROBE[key];
      const c = buildBlackHoleConfig({ [key]: probe });
      expect(c[key as keyof typeof c]).toBeCloseTo(probe, 5);
      if (key !== "separation") {
        expect(c.separation).toBe(defaultPhysics.separation);
      }
    });
  }
});

describe("buildBlackHoleConfig — low vs high semantics (smoke)", () => {
  test("higher primaryMass → larger primary horizon", () => {
    const lo = buildBlackHoleConfig({ primaryMass: 0.3 });
    const hi = buildBlackHoleConfig({ primaryMass: 1.2 });
    expect(hi.eventHorizonPrimary).toBeGreaterThan(lo.eventHorizonPrimary);
  });

  test("higher secondaryMass → larger secondary (independent of M₁)", () => {
    const lo = buildBlackHoleConfig({ secondaryMass: 0.2 });
    const hi = buildBlackHoleConfig({ secondaryMass: 1.1 });
    expect(hi.secondaryMass).toBeGreaterThan(lo.secondaryMass);
    expect(hi.eventHorizonSecondary).toBeGreaterThan(lo.eventHorizonSecondary);
    expect(hi.primaryMass).toBe(defaultPhysics.primaryMass);
  });

  test("higher separation → slower orbital frequency", () => {
    const tight = buildBlackHoleConfig({ separation: 8 });
    const wide = buildBlackHoleConfig({ separation: 30 });
    expect(wide.orbitalFrequency).toBeLessThan(tight.orbitalFrequency);
  });

  test("higher |spin| shrinks prograde ISCO", () => {
    const low = buildBlackHoleConfig({ spin: 0.05 });
    const high = buildBlackHoleConfig({ spin: 0.9 });
    expect(high.iscoPrimary).toBeLessThan(low.iscoPrimary);
  });

  test("higher cameraDistance preserved", () => {
    const near = buildBlackHoleConfig({ cameraDistance: 12 });
    const far = buildBlackHoleConfig({ cameraDistance: 55 });
    expect(far.cameraDistance).toBeGreaterThan(near.cameraDistance);
  });

  test("higher diskOuterRadiusM enlarges scale height", () => {
    const small = buildBlackHoleConfig({ diskOuterRadiusM: 6 });
    const large = buildBlackHoleConfig({ diskOuterRadiusM: 20 });
    expect(large.diskScaleHeightPrimary).toBeGreaterThan(
      small.diskScaleHeightPrimary,
    );
  });

  test("higher diskAspectRatio → taller disks", () => {
    const thin = buildBlackHoleConfig({ diskAspectRatio: 0.02 });
    const thick = buildBlackHoleConfig({ diskAspectRatio: 0.12 });
    expect(thick.diskScaleHeightPrimary).toBeGreaterThan(
      thin.diskScaleHeightPrimary,
    );
  });

  test("temperature / accretion pass through", () => {
    const c = buildBlackHoleConfig({
      peakTemperature: 40,
      temperatureIndex: 0.75,
      accretionRate: 4,
    });
    expect(c.peakTemperature).toBe(40);
    expect(c.temperatureIndex).toBe(0.75);
    expect(c.accretionRate).toBe(4);
  });

  test("inclination low vs high", () => {
    expect(buildBlackHoleConfig({ inclination: 10 }).inclination).toBe(10);
    expect(buildBlackHoleConfig({ inclination: 160 }).inclination).toBe(160);
  });
});
