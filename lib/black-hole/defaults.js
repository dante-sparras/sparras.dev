/**
 * Default simulation config from dgreenheck/webgpu-black-hole main.js.
 * @see https://github.com/dgreenheck/webgpu-black-hole
 */
export const defaultBlackHoleConfig = {
  blackHoleMass: 0.4,
  diskInnerRadius: 4.1,
  diskOuterRadius: 14.5,
  diskTemperature: 49.78,
  temperatureFalloff: 5.22,
  diskBrightness: 5,
  diskRotationSpeed: -8.7,
  turbulenceScale: 1.81,
  turbulenceStretch: 0.75,
  turbulenceSharpness: 7.4,
  turbulenceCycleTime: 5,
  turbulenceLacunarity: 3,
  turbulencePersistence: 0.8,
  diskEdgeSoftnessInner: 0.18,
  diskEdgeSoftnessOuter: 0.5,
  gravitationalLensing: 2.4,
  dopplerStrength: 1.0,
  stepSize: 1,
  starsEnabled: true,
  starBackgroundColor: "#000000",
  starDensity: 0.1,
  starSize: 1.2,
  starBrightness: 0.1,
  nebulaEnabled: true,
  nebula1Scale: 2,
  nebula1Density: 0.5,
  nebula1Brightness: 0.01,
  nebula1Color: "#071f44",
  nebula2Scale: 5.5,
  nebula2Density: 0.05,
  nebula2Brightness: 0.21,
  nebula2Color: "#010615",
  bloomStrength: 0.68,
  bloomRadius: 0.2,
  bloomThreshold: 0.4,
};

/**
 * Camera defaults from main.js
 * PerspectiveCamera FOV 60, position (0, -5, 20), lookAt origin
 */
export const defaultCamera = {
  fov: 60,
  position: { x: 0, y: -5, z: 20 },
  minDistance: 5,
  maxDistance: 50,
  rotateSpeed: -0.5,
  dampingFactor: 0.05,
};
