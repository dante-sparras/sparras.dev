// @ts-nocheck
// Three.js TSL Fn() bodies are not accurately typed.

/**
 * Mini-disk emission: T(r) → color, Doppler g, optical depth.
 * Do not addAssign parent accumulators here — composite inline in create.ts.
 */

import {
  vec3,
  float,
  Fn,
  sqrt,
  max,
  min,
  abs,
  exp,
  pow,
  smoothstep,
  mix,
  clamp,
  normalize,
  cross,
  dot,
  length,
} from "three/tsl";
import { DISK } from "./constants";
import { temperatureToDiskColor } from "./blackbody";

/** Remap x from [a, b] → [0, 1] with hard clamp. */
export const unitRange = Fn(([x, a, b]) => {
  return clamp(x.sub(a).div(max(b.sub(a), float(1e-3))), float(0), float(1));
});

/**
 * Horizontal distance from a point to a hole center in the XZ plane.
 */
export const cylindricalRadiusXZ = Fn(([point, holeCenter]) => {
  const dx = point.x.sub(holeCenter.x);
  const dz = point.z.sub(holeCenter.z);
  return sqrt(dx.mul(dx).add(dz.mul(dz)));
});

/**
 * Thin-disk temperature: T(r) = T_peak × (r_in / r)^α  [Kelvin]
 */
export const diskTemperatureAtRadius = Fn(
  ([radius, innerRadius, peakTemperatureKelvin, alpha]) => {
    const r = max(radius, innerRadius);
    const ratio = max(innerRadius.div(r), float(1e-4));
    return peakTemperatureKelvin.mul(pow(ratio, alpha));
  },
);

/**
 * Kerr circular Ω = 1 / (r^{3/2}/√M + a), a = χ M
 */
export const kerrCircularOmega = Fn(([radius, mass, spinChi]) => {
  const M = max(mass, float(1e-4));
  const chi = clamp(spinChi, float(-0.998), float(0.998));
  const a = chi.mul(M);
  const r = max(radius, float(1e-3));
  return float(1).div(pow(r, float(1.5)).div(sqrt(M)).add(a));
});

/**
 * Disk frequency shift g ≈ g_grav · g_sr, clamped.
 * mu = cos angle between orbital v and LOS (approaching > 0).
 */
export const diskDopplerG = Fn(([radius, mass, spinChi, mu]) => {
  const M = max(mass, float(1e-4));
  const r = max(radius, float(1.05).mul(M));
  const omega = kerrCircularOmega(r, M, spinChi);
  const beta = min(float(0.85), abs(omega.mul(r)));
  const m = clamp(mu, float(-1), float(1));
  const gSr = sqrt(max(float(1e-6), float(1).sub(beta.mul(beta)))).div(
    max(float(1e-4), float(1).sub(beta.mul(m))),
  );
  const gGrav = sqrt(max(float(1e-4), float(1).sub(M.mul(2).div(r))));
  return clamp(gSr.mul(gGrav), float(0.3), float(2.5));
});

/**
 * Emission from one mini-disk along a short path segment.
 * beamingFactor is the Doppler g (frequency shift), not a fake phase cosine.
 * Color from absolute T (and T·g for Doppler-shifted spectrum).
 * Returns premultiplied RGB in .xyz and segment opacity in .w.
 */
export const sampleMiniDisk = Fn(
  ([
    cylindricalRadius,
    height,
    innerRadius,
    outerRadius,
    scaleHeight,
    peakTemperatureUnits,
    temperatureIndex,
    accretionRate,
    stepLength,
    dopplerG,
  ]) => {
    const inDisk = smoothstep(
      innerRadius.sub(DISK.softIn),
      innerRadius.add(DISK.softIn),
      cylindricalRadius,
    ).mul(
      smoothstep(
        outerRadius.add(DISK.softOut),
        outerRadius.sub(DISK.softOut),
        cylindricalRadius,
      ),
    );

    const H = max(scaleHeight, float(DISK.scaleHeightFloor));
    const yOverH = abs(height).div(H);
    const verticalDensity = exp(
      yOverH.mul(yOverH).mul(float(DISK.verticalExp)).negate(),
    );
    const verticalGate = smoothstep(
      float(DISK.verticalGateLo),
      float(DISK.verticalGateHi),
      verticalDensity,
    );

    const peakKelvin = peakTemperatureUnits.mul(1000.0);
    const localT = diskTemperatureAtRadius(
      cylindricalRadius,
      innerRadius,
      peakKelvin,
      temperatureIndex,
    );
    // Doppler-shifted temperature for thermal spectrum
    const g = clamp(dopplerG, float(0.3), float(2.5));
    const tObs = localT.mul(g);
    const color = temperatureToDiskColor(tObs);

    const heat = clamp(
      localT.div(max(peakKelvin, float(1))),
      float(0),
      float(1),
    );
    // I ∝ g³ for surface brightness transform
    const g3 = g.mul(g).mul(g);
    const brightness = accretionRate
      .mul(DISK.brightnessScale)
      .mul(mix(float(DISK.heatBrightLo), float(DISK.heatBrightHi), heat))
      .mul(
        float(1).add(
          float(DISK.heatBoostAmt).mul(
            smoothstep(float(DISK.heatBoostStart), float(1), heat),
          ),
        ),
      )
      .mul(g3)
      .min(float(DISK.brightnessCap));

    const opticalDepth = verticalDensity
      .mul(verticalGate)
      .mul(mix(float(DISK.odHeatLo), float(DISK.odHeatHi), heat))
      .mul(stepLength.mul(DISK.odStepScale))
      .mul(inDisk);

    const segmentOpacity = opticalDepth.min(float(DISK.segmentOpacityCap));
    return color.mul(brightness).mul(segmentOpacity).toVec4(segmentOpacity);
  },
);

/**
 * Line-of-sight cosine for prograde equatorial orbital velocity around a hole.
 * mid = sample point, hole = center, rayDir = photon direction (observer←scene).
 * Orbital v ∥ +Y × r_cyl_hat (prograde for +Y spin / disk normal).
 * μ > 0 when gas approaches the observer (against photon direction).
 */
export const orbitalApproachMu = Fn(([mid, holeCenter, rayDir]) => {
  const rel = mid.sub(holeCenter);
  const radial = vec3(rel.x, float(0), rel.z);
  const rLen = max(length(radial), float(1e-4));
  const rHat = radial.div(rLen);
  const spinAxis = vec3(0, 1, 0);
  const vHat = normalize(cross(spinAxis, rHat));
  // Photon travels rayDir; approaching gas has velocity opposite to rayDir
  return clamp(dot(vHat, rayDir.negate()), float(-1), float(1));
});
