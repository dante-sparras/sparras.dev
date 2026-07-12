// @ts-nocheck
// Three.js TSL Fn() bodies are not accurately typed.

/**
 * Mini-disk emission helpers (color, temperature, optical depth).
 * Used by the main raymarch — do not addAssign parent accumulators here.
 */

import {
  vec3,
  float,
  Fn,
  sqrt,
  max,
  abs,
  exp,
  pow,
  smoothstep,
  mix,
  clamp,
} from "three/tsl";
import { DISK } from "./constants";

/** Remap x from [a, b] → [0, 1] with hard clamp. */
export const unitRange = Fn(([x, a, b]) => {
  return clamp(x.sub(a).div(max(b.sub(a), float(1e-3))), float(0), float(1));
});

/**
 * Horizontal distance from a point to a hole center in the XZ plane.
 * (Disks live in the orbital plane; we ignore y here.)
 */
export const cylindricalRadiusXZ = Fn(([point, holeCenter]) => {
  const dx = point.x.sub(holeCenter.x);
  const dz = point.z.sub(holeCenter.z);
  return sqrt(dx.mul(dx).add(dz.mul(dz)));
});

/**
 * Interstellar-style fire color from radius on a mini-disk.
 *
 * Hue uses **where you are between r_in and r_out** (not only T/T_peak).
 * peakTemperature (1000 K units) only *biases* the whole curve warmer/cooler.
 */
export const diskColorAtRadius = Fn(
  ([radius, innerRadius, outerRadius, peakTemperatureUnits]) => {
    const width = max(outerRadius.sub(innerRadius), float(1e-3));
    const heat = clamp(
      float(1).sub(radius.sub(innerRadius).div(width)),
      float(0),
      float(1),
    );
    const shaped = pow(heat, float(DISK.heatPow));
    const warmerPeak = unitRange(
      peakTemperatureUnits,
      float(DISK.peakTCool),
      float(DISK.peakTHot),
    );
    const t = clamp(
      shaped.mul(
        mix(float(DISK.heatBiasLo), float(DISK.heatBiasHi), warmerPeak),
      ),
      float(0),
      float(1),
    );

    const deepRed = vec3(0.7, 0.05, 0.0);
    const fireRed = vec3(0.95, 0.14, 0.01);
    const orange = vec3(1.0, 0.32, 0.04);
    const amber = vec3(1.0, 0.48, 0.08);
    const hotGold = vec3(1.0, 0.58, 0.12);

    const cool = mix(deepRed, fireRed, unitRange(t, float(0), float(0.35)));
    const mid = mix(orange, amber, unitRange(t, float(0.3), float(0.7)));
    const hot = mix(amber, hotGold, unitRange(t, float(0.65), float(1)));
    const a = mix(cool, mid, unitRange(t, float(0.15), float(0.55)));
    return clamp(
      mix(a, hot, unitRange(t, float(0.5), float(0.95))),
      float(0),
      float(1),
    );
  },
);

/**
 * Thin-disk temperature: T(r) = T_peak × (r_in / r)^α
 * Used for **brightness**, not the main hue driver.
 */
export const diskTemperatureAtRadius = Fn(
  ([radius, innerRadius, peakTemperatureKelvin, alpha]) => {
    const r = max(radius, innerRadius);
    const ratio = max(innerRadius.div(r), float(1e-4));
    return peakTemperatureKelvin.mul(pow(ratio, alpha));
  },
);

/**
 * Emission from one mini-disk along a short path segment.
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
    beamingFactor,
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
    const color = diskColorAtRadius(
      cylindricalRadius,
      innerRadius,
      outerRadius,
      peakTemperatureUnits,
    );

    const heat = clamp(
      localT.div(max(peakKelvin, float(1))),
      float(0),
      float(1),
    );
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
      .mul(beamingFactor)
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
