/**
 * Named numerical knobs for the raymarch / disk / grade pipeline.
 * Only values still tuned live here — frozen art is inlined at use sites.
 */

export const MARCH = {
  maxSteps: 80,
  escapeRadius: 180,
  /** Near-photon dwell cap — kills multi-orbit eye rings. */
  dwellCapture: 5,
  softCapturePhotonMul: 1.15,
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
} as const;

export const GRADE = {
  tonemapSoft: 0.55,
  tonemapGain: 1.15,
  greenCapOfRed: 0.72,
  blueCapOfRed: 0.25,
  silAaHorizonFrac: 0.04,
  silAaScreenPx: 1.0,
  silPhotonMix: 0.35,
  brightCoverLo: 0.02,
  brightCoverHi: 0.22,
  discardAlpha: 0.002,
  discardPeak: 0.002,
} as const;
