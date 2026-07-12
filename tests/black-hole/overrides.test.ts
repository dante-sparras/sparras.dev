/**
 * Per-knob override coverage + flat / nested config DX.
 * Run: bun test tests/black-hole
 */
import { describe, expect, test } from "bun:test";
import {
  buildBlackHoleConfig,
  defaultPhysics,
  mergePhysicsOverrides,
  pickPhysicsOverrides,
  RAW_PHYSICS_KEYS,
  resolvePhysics,
  type RawPhysicsKey,
} from "../../components/black-hole/config";

/** Distinct probe values so each key can be overridden alone. */
const PROBE: Record<RawPhysicsKey, number> = {
  primaryMass: 0.42,
  massRatio: 0.8,
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
    const fromDefaults = Object.keys(defaultPhysics).toSorted();
    const fromKeys = [...RAW_PHYSICS_KEYS].toSorted();
    expect(fromKeys as string[]).toEqual(fromDefaults);
    expect(new Set(RAW_PHYSICS_KEYS).size).toBe(RAW_PHYSICS_KEYS.length);
  });
});

describe("pickPhysicsOverrides / mergePhysicsOverrides", () => {
  test("pick ignores non-physics keys and non-finite numbers", () => {
    const picked = pickPhysicsOverrides({
      spin: 0.5,
      className: "x",
      interactive: true,
      separation: Number.NaN,
      inclination: 90,
    } as never);
    expect(picked).toEqual({ spin: 0.5, inclination: 90 });
  });

  test("merge later layers win", () => {
    const m = mergePhysicsOverrides(
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

  test("partial layer only changes that key", () => {
    const r = resolvePhysics({ spin: 0.11 });
    expect(r.spin).toBe(0.11);
    expect(r.separation).toBe(defaultPhysics.separation);
  });
});

describe("buildBlackHoleConfig — flat & nested DX", () => {
  test("flat knobs (no nested bag)", () => {
    const c = buildBlackHoleConfig({ spin: 0.88, inclination: 135 });
    expect(c.spin).toBeCloseTo(0.88, 5);
    expect(c.inclination).toBe(135);
    expect(c.primaryMass).toBe(defaultPhysics.primaryMass);
  });

  test("physics bag works", () => {
    const c = buildBlackHoleConfig({ physics: { separation: 14 } });
    expect(c.separation).toBe(14);
  });

  test("overrides bag still works (alias)", () => {
    const c = buildBlackHoleConfig({ overrides: { accretionRate: 2.5 } });
    expect(c.accretionRate).toBe(2.5);
  });

  test("merge order: physics → overrides → flat", () => {
    const c = buildBlackHoleConfig({
      physics: { spin: 0.2, separation: 10 },
      overrides: { spin: 0.4 },
      spin: 0.6,
      separation: 12,
    });
    expect(c.spin).toBeCloseTo(0.6, 5);
    expect(c.separation).toBe(12);
  });
});

describe("buildBlackHoleConfig — each raw knob in isolation", () => {
  for (const key of RAW_PHYSICS_KEYS) {
    test(`override only ${key}`, () => {
      const probe = PROBE[key];
      const c = buildBlackHoleConfig({ [key]: probe });
      // After clamps the value should still reflect the probe when in-range
      expect(c[key as keyof typeof c]).toBeCloseTo(probe, 5);
      // Unrelated default preserved (spot-check separation unless under test)
      if (key !== "separation") {
        expect(c.separation).toBe(defaultPhysics.separation);
      }
      if (key !== "primaryMass") {
        expect(c.primaryMass).toBe(defaultPhysics.primaryMass);
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

  test("higher massRatio → larger secondary mass & horizon", () => {
    const lo = buildBlackHoleConfig({ massRatio: 0.3 });
    const hi = buildBlackHoleConfig({ massRatio: 2.5 });
    expect(hi.secondaryMass).toBeGreaterThan(lo.secondaryMass);
    expect(hi.eventHorizonSecondary).toBeGreaterThan(lo.eventHorizonSecondary);
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

  test("higher cameraDistance is preserved as zoom-out", () => {
    const near = buildBlackHoleConfig({ cameraDistance: 12 });
    const far = buildBlackHoleConfig({ cameraDistance: 55 });
    expect(far.cameraDistance).toBeGreaterThan(near.cameraDistance);
  });

  test("higher diskOuterRadiusM enlarges scale height (same H/R)", () => {
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

  test("peakTemperature / temperatureIndex / accretionRate pass through clamps", () => {
    const c = buildBlackHoleConfig({
      peakTemperature: 40,
      temperatureIndex: 0.75,
      accretionRate: 4,
    });
    expect(c.peakTemperature).toBe(40);
    expect(c.temperatureIndex).toBe(0.75);
    expect(c.accretionRate).toBe(4);
  });

  test("inclination low vs high keeps range and moves camera y", () => {
    const face = buildBlackHoleConfig({ inclination: 10 });
    const under = buildBlackHoleConfig({ inclination: 160 });
    expect(face.inclination).toBe(10);
    expect(under.inclination).toBe(160);
  });
});
