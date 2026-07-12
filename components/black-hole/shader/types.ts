import type { BlackHoleConfig } from "../config";

/**
 * TSL / Three uniform bag entry. Host uses `uniform(...)` from three/tsl;
 * we only need `.value` on the CPU side.
 */
export type UniformNode<T = number> = { value: T };

/**
 * Scalar fields copied from {@link BlackHoleConfig} into the GPU.
 * Keep this list in sync with what the raymarch reads.
 * `spin` (χ) drives local Kerr null deflection + disk orbital Doppler.
 * (No pixelSize — host DPR owns pixel art resolution.)
 */
export const CONFIG_SCALAR_KEYS = [
  "primaryMass",
  "secondaryMass",
  "totalMass",
  "separation",
  "orbitalFrequency",
  "spin",
  "eventHorizonPrimary",
  "eventHorizonSecondary",
  "photonSpherePrimary",
  "photonSphereSecondary",
  "iscoPrimary",
  "iscoSecondary",
  "diskOuterRadiusM",
  "diskScaleHeightPrimary",
  "diskScaleHeightSecondary",
  "peakTemperature",
  "temperatureIndex",
  "accretionRate",
  "stepSize",
  "ditherStrength",
  "colorLevels",
] as const satisfies readonly (keyof BlackHoleConfig)[];

/** Full uniform bag for {@link createBlackHoleShader}. */
export type BlackHoleUniforms = {
  /** Simulation time in seconds (drives orbital phase φ = Ω t). */
  time: UniformNode<number>;
  /** Viewport size in framebuffer pixels. */
  resolution: UniformNode<import("three").Vector2>;
  cameraPosition: UniformNode<import("three").Vector3>;
  cameraForward: UniformNode<import("three").Vector3>;
  cameraRight: UniformNode<import("three").Vector3>;
  cameraUp: UniformNode<import("three").Vector3>;
  /** Vertical FOV in degrees. */
  cameraFov: UniformNode<number>;
} & Record<(typeof CONFIG_SCALAR_KEYS)[number], UniformNode<number>>;
