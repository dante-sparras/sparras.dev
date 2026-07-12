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
  buildBlackHoleConfig,
  CAMERA_FOV_DEG,
  cameraPositionFromObserver,
  defaultPhysics,
  defaultRender,
  orbitDistanceLimits,
  skyDomeRadius,
} from "../../components/black-hole/config";
import { kerrScales } from "../../components/black-hole/kerr";
import { CONFIG_SCALAR_KEYS } from "../../components/black-hole/shader/types";

describe("orbitDistanceLimits / skyDomeRadius", () => {
  test("sky shell stays outside max zoom", () => {
    for (const d of [12, 28, 50, 100]) {
      const { min, max } = orbitDistanceLimits(d);
      expect(min).toBeLessThan(max);
      expect(skyDomeRadius(max)).toBeGreaterThanOrEqual(max);
      expect(skyDomeRadius(max)).toBeGreaterThanOrEqual(80);
    }
  });
});

describe("cameraPositionFromObserver", () => {
  test("face-on inclination ~0 sits near +Y", () => {
    const [x, y, z] = cameraPositionFromObserver(0.5, 28);
    expect(y).toBeGreaterThan(Math.abs(x));
    expect(y).toBeGreaterThan(Math.abs(z) * 0.5);
    const r = Math.hypot(x, y, z);
    expect(r).toBeCloseTo(28, 3);
  });
  test("edge-on inclination ~90 lowers y", () => {
    const face = cameraPositionFromObserver(5, 28);
    const edge = cameraPositionFromObserver(89, 28);
    expect(Math.abs(edge[1])).toBeLessThan(Math.abs(face[1]));
  });
  test("distance floored at 8", () => {
    const [x, y, z] = cameraPositionFromObserver(45, 1);
    expect(Math.hypot(x, y, z)).toBeGreaterThanOrEqual(8 - 1e-6);
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
      overrides: { primaryMass: 0.6, massRatio: 0.5, separation: 14 },
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
      overrides: { primaryMass: 0.7, massRatio: 1.2, spin: 0.5 },
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

  test("large separation raises camera for FOV fit without proportional lock", () => {
    const c = buildBlackHoleConfig({
      overrides: { separation: 40, cameraDistance: 28 },
    });
    expect(c.cameraDistance).toBeGreaterThanOrEqual(40 * 1.55 + 4);
    const def = buildBlackHoleConfig();
    expect(c.separation / c.cameraDistance).toBeGreaterThan(
      (def.separation / def.cameraDistance) * 0.5,
    );
  });

  test("explicit cameraDistance still FOV-floored by separation", () => {
    const c = buildBlackHoleConfig({
      overrides: { separation: 30, cameraDistance: 10 },
    });
    expect(c.cameraDistance).toBeGreaterThanOrEqual(30 * 1.55 + 4);
  });

  test("mass ratio yields different per-hole scale heights", () => {
    const c = buildBlackHoleConfig({
      overrides: { massRatio: 0.3 },
    });
    expect(c.diskScaleHeightSecondary).toBeLessThan(c.diskScaleHeightPrimary);
    expect(c.iscoSecondary).toBeLessThan(c.iscoPrimary);
  });

  test("clamps extreme raw knobs", () => {
    const c = buildBlackHoleConfig({
      overrides: {
        primaryMass: -1,
        massRatio: 100,
        spin: 5,
        inclination: 200,
        diskAspectRatio: 9,
        temperatureIndex: 0.01,
        accretionRate: -5,
        separation: 0.1,
        diskOuterRadiusM: 0.5,
      },
    });
    expect(c.primaryMass).toBeGreaterThanOrEqual(0.08);
    expect(c.massRatio).toBeLessThanOrEqual(4);
    expect(Math.abs(c.spin)).toBeLessThanOrEqual(0.998);
    expect(c.inclination).toBeLessThanOrEqual(89.5);
    expect(c.diskAspectRatio).toBeLessThanOrEqual(0.25);
    expect(c.temperatureIndex).toBeGreaterThanOrEqual(0.5);
    expect(c.accretionRate).toBeGreaterThanOrEqual(0.1);
    expect(c.separation).toBeGreaterThanOrEqual(2.5);
    expect(c.diskOuterRadiusM).toBeGreaterThanOrEqual(3);
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

  test("render fields come from defaultRender only", () => {
    const c = buildBlackHoleConfig();
    expect(c.stepSize).toBe(defaultRender.stepSize);
    expect(c.pixelSize).toBe(defaultRender.pixelSize);
    expect(c.ditherStrength).toBe(defaultRender.ditherStrength);
    expect(c.colorLevels).toBe(defaultRender.colorLevels);
  });

  test("every CONFIG_SCALAR_KEY exists as finite number on config", () => {
    const c = buildBlackHoleConfig({
      overrides: { massRatio: 0.4, spin: 0.7, separation: 16 },
    });
    for (const key of CONFIG_SCALAR_KEYS) {
      const v = c[key];
      expect(typeof v).toBe("number");
      expect(Number.isFinite(v)).toBe(true);
    }
  });
});
