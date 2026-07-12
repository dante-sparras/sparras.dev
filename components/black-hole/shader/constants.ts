/**
 * Named numerical knobs for the raymarch / disk / grade pipeline.
 * Presentation + numerics only — not public physics overrides.
 */

export const MARCH = {
  maxSteps: 80,
  escapeRadius: 180,
  /** Near-photon dwell accumulator cap — kills multi-orbit “eye rings”. */
  dwellCapture: 5,
  horizonPad: 1.02,
  photonFloorMul: 1.05,
  iscoFloorMul: 1.2,
  diskInnerPad: 1.02,
  diskOuterMinMul: 1.5,
  outerMulFloor: 3,
  stepBaseFloor: 0.08,
  scaleHeightFloor: 0.1,
  separationFloor: 2,
  nearPhotonInner: 0.85,
  nearPhotonOuter: 2.2,
  nearPlaneHeight: 1.5,
  farStart: 8,
  farEnd: 50,
  farStepFrac: 0.14,
  nearPhotonStepMul: 0.4,
  nearPlaneStepMul: 0.55,
  stepRLimit: 0.3,
  stepMinMul: 0.28,
  softCapturePhotonMul: 2,
} as const;

export const DISK = {
  /** Radial soft-edge width near ISCO / outer rim. */
  softIn: 0.05,
  softOut: 0.08,
  scaleHeightFloor: 0.08,
  verticalExp: 1.2,
  verticalGateLo: 0.008,
  verticalGateHi: 0.2,
  /** Relative brightness / optical-depth fudge (exposure stack). */
  brightnessScale: 0.38,
  heatBrightLo: 0.75,
  heatBrightHi: 1.2,
  heatBoostStart: 0.7,
  heatBoostAmt: 0.25,
  brightnessCap: 4.5,
  odHeatLo: 0.95,
  odHeatHi: 1.15,
  odStepScale: 2.8,
  segmentOpacityCap: 0.55,
  /** Fake orbital-phase brightness asymmetry (not true Doppler). */
  beamAmp: 0.25,
  /** peakTemperature (1000 K units) warmer-bias window. */
  peakTCool: 28,
  peakTHot: 75,
  heatPow: 1.35,
  heatBiasLo: 0.85,
  heatBiasHi: 1.08,
} as const;

export const GRADE = {
  tonemapSoft: 0.55,
  tonemapGain: 1.15,
  /** Chroma mix amount — must stay in [0, 1]. */
  chromaMix: 1,
  greenCapOfRed: 0.72,
  blueCapOfRed: 0.25,
  silAaHorizonFrac: 0.06,
  silAaScreenPx: 1.5,
  brightCoverLo: 0.02,
  brightCoverHi: 0.3,
  mattePeakLo: 0.05,
  mattePeakHi: 0.35,
  matteAlphaLo: 0.15,
  matteAlphaHi: 0.85,
  matteStrength: 0.85,
  discardAlpha: 0.002,
  discardPeak: 0.002,
} as const;
