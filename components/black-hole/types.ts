/** Hex color: `#rgb`, `#rgba`, `#rrggbb`, or `#rrggbbaa`. */
export type HexColor = string;

/** Non-color simulation knobs (defaults.ts). */
export type BlackHoleSimConfig = {
  blackHoleMass: number;
  gravitationalLensing: number;
  dopplerStrength: number;
  diskInnerRadius: number;
  diskOuterRadius: number;
  diskBrightness: number;
  diskTemperature: number;
  temperatureFalloff: number;
  diskEdgeSoftnessInner: number;
  diskEdgeSoftnessOuter: number;
  diskSaturation: number;
  turbulenceScale: number;
  turbulenceStretch: number;
  turbulenceSharpness: number;
  diskRotationSpeed: number;
  turbulenceCycleTime: number;
  turbulenceLacunarity: number;
  turbulencePersistence: number;
  starsEnabled: boolean;
  starDensity: number;
  starSize: number;
  starBrightness: number;
  nebulaEnabled: boolean;
  nebula1Scale: number;
  nebula1Density: number;
  nebula2Scale: number;
  nebula2Density: number;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  stepSize: number;
  /** 0 = emissive, 1 = ink stamp */
  diskInkMode: number;
};

/** Color fields from theme tokens (or manual overrides). */
export type BlackHoleColorConfig = {
  starBackgroundColor: HexColor;
  nebula1Color: HexColor;
  nebula2Color: HexColor;
  starTint: HexColor;
  diskTint: HexColor;
};

/** Full runtime config = sim knobs + colors. */
export type BlackHoleConfig = BlackHoleSimConfig & BlackHoleColorConfig;

export type BlackHoleConfigPatch = Partial<BlackHoleConfig>;

export type BlackHoleCameraConfig = {
  fov: number;
  position: { x: number; y: number; z: number };
  minDistance: number;
  maxDistance: number;
  rotateSpeed: number;
  dampingFactor: number;
};

/**
 * TSL uniform bag passed into the raymarch shader.
 * Values are Three.js TSL UniformNodes (also usable as graph nodes).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BlackHoleUniforms = Record<string, any>;
