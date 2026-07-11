import type { BlackHoleCameraConfig, BlackHoleSimConfig } from "./types";

/**
 * Non-color simulation defaults (dgreenheck/webgpu-black-hole + site tweaks).
 * Colors come from theme.ts (CSS tokens) at runtime.
 *
 * @see ./theme.ts (same folder)
 * @see https://github.com/dgreenheck/webgpu-black-hole
 */
export const defaultBlackHoleConfig: BlackHoleSimConfig = {
  // —— Black Hole ——
  blackHoleMass: 0.4,
  gravitationalLensing: 2.95,
  dopplerStrength: 0.55,
  // Geometry
  diskInnerRadius: 4.1,
  diskOuterRadius: 14.5,
  // Appearance (non-color)
  diskBrightness: 4.4,
  diskTemperature: 50,
  temperatureFalloff: 0.45,
  diskEdgeSoftnessInner: 0.55,
  diskEdgeSoftnessOuter: 0.75,
  diskSaturation: 1.0,
  // Turbulence
  turbulenceScale: 1.15,
  turbulenceStretch: 6.0,
  turbulenceSharpness: 1.25,
  diskRotationSpeed: -8.7,
  turbulenceCycleTime: 5,
  turbulenceLacunarity: 2.1,
  turbulencePersistence: 0.55,
  // —— Stars (non-color) ——
  starsEnabled: true,
  starDensity: 0.1,
  starSize: 1.75,
  starBrightness: 0.1,
  // —— Nebula (non-color) ——
  nebulaEnabled: true,
  nebula1Scale: 2,
  nebula1Density: 0.5,
  nebula2Scale: 5.5,
  nebula2Density: 0.05,
  // —— Bloom ——
  bloomStrength: 0.62,
  bloomRadius: 0.32,
  bloomThreshold: 0.36,

  stepSize: 0.75,
  /** 0 = emissive, 1 = ink stamp (light theme sets this) */
  diskInkMode: 0,
};

/** Camera from reference main.js */
export const defaultCamera: BlackHoleCameraConfig = {
  fov: 60,
  position: { x: 0, y: -5, z: 20 },
  minDistance: 5,
  maxDistance: 50,
  rotateSpeed: -0.5,
  dampingFactor: 0.05,
};
