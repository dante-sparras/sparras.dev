/**
 * Named numerical knobs for the raymarch / disk / grade pipeline.
 * Presentation + numerics only — not public physics knobs.
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
} as const;

export const DISK = {
  softIn: 0.05,
  softOut: 0.08,
  scaleHeightFloor: 0.08,
  verticalExp: 1.2,
  verticalGateLo: 0.008,
  verticalGateHi: 0.2,
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
  peakTCool: 28,
  peakTHot: 75,
  heatPow: 1.35,
  heatBiasLo: 0.85,
  heatBiasHi: 1.08,
} as const;

export const GRADE = {
  tonemapSoft: 0.55,
  tonemapGain: 1.15,
  chromaMix: 1,
  greenCapOfRed: 0.72,
  blueCapOfRed: 0.25,
  /** Soft silhouette width as fraction of horizon. */
  silAaHorizonFrac: 0.04,
  silAaScreenPx: 1.0,
  /** Silhouette outer edge: 0 = horizon only, 1 = full photon sphere. */
  silPhotonMix: 0.35,
  /**
   * Where disk is bright, keep gas RGB under the silhouette
   * (single cover term — no second matte pass).
   */
  brightCoverLo: 0.02,
  brightCoverHi: 0.22,
  softCapturePhotonMul: 1.15,
  discardAlpha: 0.002,
  discardPeak: 0.002,
} as const;
