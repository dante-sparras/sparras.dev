/**
 * buildBlackHoleConfig, camera, FOV/skydome, raw→derived invariants.
 * Run: bun test tests/black-hole
 */
import { describe, expect, test } from "bun:test";
import {
  binaryArmLengths,
  binaryOrbitalOmega,
} from "../../components/black-hole/binary";
import {
  binaryVisualExtent,
  buildBlackHoleConfig,
  CAMERA_FOV_DEG,
  cameraPositionFromObserver,
  defaultPhysics,
  defaultRender,
  orbitDistanceLimits,
  PHYSICS_LIMITS,
  skyDomeRadius,
  withLightThemeAccretion,
} from "../../components/black-hole/config";
import { kerrScales } from "../../components/black-hole/kerr";
import { CONFIG_SCALAR_KEYS } from "../../components/black-hole/shader/types";

describe("orbitDistanceLimits / skyDomeRadius", () => {
  test("sky shell stays outside max zoom", () => {
    for (const d of [12, 28, 50, 100]) {
      const { min, max } = orbitDistanceLimits(d, 10);
      expect(min).toBeLessThan(max);
      expect(skyDomeRadius(max)).toBeGreaterThanOrEqual(max);
      expect(skyDomeRadius(max)).toBeGreaterThanOrEqual(
        PHYSICS_LIMITS.skyDomeMin,
      );
    }
  });

  test("geometry extent raises orbit min (anti-tunnel)", () => {
    const noExtent = orbitDistanceLimits(30);
    const wide = orbitDistanceLimits(30, 25);
    expect(wide.min).toBeGreaterThanOrEqual(noExtent.min);
  });
});

describe("cameraPositionFromObserver", () => {
  test("face-on inclination ~0 sits near +Y", () => {
    const [x, y, z] = cameraPositionFromObserver(0, 28);
    expect(y).toBeGreaterThan(Math.abs(x));
    expect(y).toBeGreaterThan(Math.abs(z) * 0.5);
    const r = Math.hypot(x, y, z);
    expect(r).toBeCloseTo(28, 3);
  });

  test("edge-on inclination ~90 lowers |y|", () => {
    const face = cameraPositionFromObserver(5, 28);
    const edge = cameraPositionFromObserver(90, 28);
    expect(Math.abs(edge[1])).toBeLessThan(Math.abs(face[1]));
    expect(Math.abs(edge[1])).toBeLessThan(1e-6);
  });

  test("i=135 places camera below the orbital plane (y < 0)", () => {
    const [x, y, z] = cameraPositionFromObserver(135, 28);
    expect(y).toBeLessThan(0);
    expect(Math.abs(y)).toBeCloseTo(28 * Math.SQRT1_2, 4);
    expect(Math.hypot(x, y, z)).toBeGreaterThanOrEqual(28 - 1e-6);
    expect(Math.hypot(x, y, z)).toBeLessThan(28 * 1.02);
  });

  test("i=180 is face-on from −Y", () => {
    const [, y, z] = cameraPositionFromObserver(180, 28);
    expect(y).toBeCloseTo(-28, 5);
    expect(Math.abs(z)).toBeLessThan(1e-6);
  });

  test("distance floored at cameraDistanceMin", () => {
    const [x, y, z] = cameraPositionFromObserver(45, 1);
    expect(Math.hypot(x, y, z)).toBeGreaterThanOrEqual(
      PHYSICS_LIMITS.cameraDistanceMin - 1e-6,
    );
  });
});

describe("CAMERA_FOV_DEG / defaultRender", () => {
  test("FOV is positive finite", () => {
    expect(CAMERA_FOV_DEG).toBeGreaterThan(10);
    expect(CAMERA_FOV_DEG).toBeLessThan(120);
  });
  test("defaultRender has presentation fields only", () => {
    expect(defaultRender.stepSize).toBeGreaterThan(0);
    expect(defaultRender.pixelSize).toBeGreaterThanOrEqual(1);
    expect(defaultRender.colorLevels).toBeGreaterThanOrEqual(2);
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

  test("secondary mass and Ω match pure binary helpers", () => {
    const c = buildBlackHoleConfig({
      primaryMass: 0.6,
      massRatio: 0.5,
      separation: 14,
    });
    expect(c.secondaryMass).toBeCloseTo(0.6 * 0.5, 8);
    expect(c.totalMass).toBeCloseTo(0.6 + 0.3, 8);
    expect(c.orbitalFrequency).toBeCloseTo(
      binaryOrbitalOmega(c.totalMass, c.separation),
      8,
    );
    const arms = binaryArmLengths(c.separation, c.primaryMass, c.secondaryMass);
    expect(arms.arm1 + arms.arm2).toBeCloseTo(c.separation, 8);
  });

  test("derived Kerr scales match kerrScales(M, χ)", () => {
    const c = buildBlackHoleConfig({
      primaryMass: 0.7,
      massRatio: 1.2,
      spin: 0.5,
    });
    const p = kerrScales(c.primaryMass, c.spin);
    const s = kerrScales(c.secondaryMass, c.spin);
    expect(c.eventHorizonPrimary).toBeCloseTo(p.eventHorizon, 8);
    expect(c.iscoPrimary).toBeCloseTo(p.iscoPrograde, 8);
    expect(c.photonSpherePrimary).toBeCloseTo(p.photonSphere, 8);
    expect(c.eventHorizonSecondary).toBeCloseTo(s.eventHorizon, 8);
    expect(c.iscoSecondary).toBeCloseTo(s.iscoPrograde, 8);
    expect(c.spinParameter).toBeCloseTo(p.a, 8);
  });

  test("inclination 135 is preserved (not clamped to 90)", () => {
    const c = buildBlackHoleConfig({ inclination: 135 });
    expect(c.inclination).toBe(135);
    const [, y] = cameraPositionFromObserver(c.inclination, c.cameraDistance);
    expect(y).toBeLessThan(0);
  });

  test("respects raw cameraDistance (not forced by separation)", () => {
    const near = buildBlackHoleConfig({
      separation: 40,
      cameraDistance: 18,
    });
    const far = buildBlackHoleConfig({
      separation: 40,
      cameraDistance: 60,
    });
    expect(near.cameraDistance).toBe(18);
    expect(far.cameraDistance).toBe(60);
    expect(far.cameraDistance).toBeGreaterThan(near.cameraDistance);
  });

  test("cameraDistance floored only at absolute minimum", () => {
    const c = buildBlackHoleConfig({
      cameraDistance: 2,
      separation: 30,
    });
    expect(c.cameraDistance).toBe(PHYSICS_LIMITS.cameraDistanceMin);
  });

  test("mass ratio yields different per-hole scale heights", () => {
    const c = buildBlackHoleConfig({ massRatio: 0.3 });
    expect(c.diskScaleHeightSecondary).toBeLessThan(c.diskScaleHeightPrimary);
    expect(c.iscoSecondary).toBeLessThan(c.iscoPrimary);
  });

  test("clamps extreme raw knobs", () => {
    const c = buildBlackHoleConfig({
      primaryMass: -1,
      massRatio: 100,
      spin: 5,
      inclination: 200,
      diskAspectRatio: 9,
      temperatureIndex: 0.01,
      accretionRate: -5,
      separation: 0.1,
      diskOuterRadiusM: 0.5,
    });
    expect(c.primaryMass).toBeGreaterThanOrEqual(PHYSICS_LIMITS.primaryMassMin);
    expect(c.massRatio).toBeLessThanOrEqual(PHYSICS_LIMITS.massRatioMax);
    expect(Math.abs(c.spin)).toBeLessThanOrEqual(0.998);
    expect(c.inclination).toBeLessThanOrEqual(PHYSICS_LIMITS.inclinationMax);
    expect(c.inclination).toBeGreaterThanOrEqual(PHYSICS_LIMITS.inclinationMin);
    expect(c.diskAspectRatio).toBeLessThanOrEqual(PHYSICS_LIMITS.diskAspectMax);
    expect(c.temperatureIndex).toBeGreaterThanOrEqual(
      PHYSICS_LIMITS.temperatureIndexMin,
    );
    expect(c.accretionRate).toBeGreaterThanOrEqual(
      PHYSICS_LIMITS.accretionRateMin,
    );
    expect(c.separation).toBeGreaterThanOrEqual(PHYSICS_LIMITS.separationMin);
    expect(c.diskOuterRadiusM).toBeGreaterThanOrEqual(
      PHYSICS_LIMITS.diskOuterRadiusMMin,
    );
  });

  test("pure build does not dim accretion for light theme", () => {
    const c = buildBlackHoleConfig({ accretionRate: 10 });
    expect(c.accretionRate).toBe(10);
  });

  test("withLightThemeAccretion dims when enabled", () => {
    const base = buildBlackHoleConfig({ accretionRate: 10 });
    const light = withLightThemeAccretion(base, true);
    const dark = withLightThemeAccretion(base, false);
    expect(light.accretionRate).toBeCloseTo(
      10 * PHYSICS_LIMITS.lightThemeAccretionScale,
      8,
    );
    expect(dark.accretionRate).toBe(10);
  });

  test("render fields come from defaultRender only", () => {
    const c = buildBlackHoleConfig();
    expect(c.stepSize).toBe(defaultRender.stepSize);
    expect(c.pixelSize).toBe(defaultRender.pixelSize);
    expect(c.ditherStrength).toBe(defaultRender.ditherStrength);
    expect(c.colorLevels).toBe(defaultRender.colorLevels);
  });

  test("every CONFIG_SCALAR_KEY exists as finite number on config", () => {
    const c = buildBlackHoleConfig({
      massRatio: 0.4,
      spin: 0.7,
      separation: 16,
    });
    for (const key of CONFIG_SCALAR_KEYS) {
      const v = c[key];
      expect(typeof v).toBe("number");
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  test("binaryVisualExtent is positive and finite", () => {
    const c = buildBlackHoleConfig();
    const e = binaryVisualExtent(c);
    expect(e).toBeGreaterThan(0);
    expect(Number.isFinite(e)).toBe(true);
  });
});
