// @ts-nocheck
// Three.js TSL Fn() bodies are not accurately typed — keep nocheck for this file.

/**
 * Binary black-hole fragment shader (WebGPU / Three.js TSL).
 *
 * Pipeline per pixel:
 * 1. Snap UV to a pixel grid (pixel art)
 * 2. Cast a camera ray through the scene
 * 3. Raymarch: bend light toward each mass, capture at horizons, sample disks
 * 4. Soft black silhouettes for the two holes
 * 5. Tonemap (keep fire red/orange, never solid yellow)
 * 6. Quantize + Bayer dither
 *
 * Units: G = c = 1 (geometric). Orbital plane is XZ; disk midplane is y = 0.
 */

import type { BlackHoleConfig } from "./config";
import {
  vec3,
  float,
  Fn,
  length,
  normalize,
  dot,
  atan,
  sqrt,
  max,
  min,
  abs,
  tan,
  exp,
  pow,
  floor,
  fract,
  smoothstep,
  step,
  mix,
  clamp,
  cos,
  sin,
  Loop,
  Break,
  If,
  Discard,
  screenUV,
  fwidth,
} from "three/tsl";

// ── Uniforms (filled by black-hole.tsx each frame) ──────────────────────────

/** TSL uniform node (`{ value: … }`). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UniformNode = { value: any };

/**
 * Scalar fields copied from {@link BlackHoleConfig} into the GPU.
 * Keep this list in sync with what the raymarch reads.
 */
export const CONFIG_SCALAR_KEYS = [
  "primaryMass",
  "secondaryMass",
  "totalMass",
  "separation",
  "orbitalFrequency",
  "spin",
  "spinParameter",
  "eventHorizonPrimary",
  "eventHorizonSecondary",
  "photonSpherePrimary",
  "photonSphereSecondary",
  "iscoPrimary",
  "iscoSecondary",
  "diskOuterRadiusM",
  "diskScaleHeight",
  "peakTemperature",
  "temperatureIndex",
  "accretionRate",
  "stepSize",
  "pixelSize",
  "ditherStrength",
  "colorLevels",
] as const satisfies readonly (keyof BlackHoleConfig)[];

/** Full uniform bag for {@link createBlackHoleShader}. */
export type BlackHoleUniforms = {
  /** Simulation time in seconds (drives orbital phase φ = Ω t). */
  time: UniformNode;
  /** Viewport size in CSS pixels. */
  resolution: UniformNode;
  cameraPosition: UniformNode;
  cameraForward: UniformNode;
  cameraRight: UniformNode;
  cameraUp: UniformNode;
  /** Vertical FOV in degrees. */
  cameraFov: UniformNode;
} & Record<(typeof CONFIG_SCALAR_KEYS)[number], UniformNode>;

const PI = float(Math.PI);

// ── Small math helpers ──────────────────────────────────────────────────────

/** Remap x from [a, b] → [0, 1] with hard clamp. */
const unitRange = Fn(([x, a, b]) => {
  return clamp(x.sub(a).div(max(b.sub(a), float(1e-3))), float(0), float(1));
});

/**
 * Horizontal distance from a point to a hole center in the XZ plane.
 * (Disks live in the orbital plane; we ignore y here.)
 */
const cylindricalRadiusXZ = Fn(([point, holeCenter]) => {
  const dx = point.x.sub(holeCenter.x);
  const dz = point.z.sub(holeCenter.z);
  return sqrt(dx.mul(dx).add(dz.mul(dz)));
});

// ── Disk appearance ─────────────────────────────────────────────────────────

/**
 * Interstellar-style fire color from radius on a mini-disk.
 *
 * Hue uses **where you are between r_in and r_out** (not only T/T_peak), so the
 * outer edge is always deep red/orange and the ISCO edge is amber — even when
 * the physical temperature ratio across a short disk is mild.
 *
 * peakTemperature (1000 K units) only *biases* the whole curve warmer/cooler.
 */
const diskColorAtRadius = Fn(
  ([radius, innerRadius, outerRadius, peakTemperatureUnits]) => {
    const width = max(outerRadius.sub(innerRadius), float(1e-3));
    // 0 at outer edge (cool), 1 at inner edge (hot)
    const heat = clamp(
      float(1).sub(radius.sub(innerRadius).div(width)),
      float(0),
      float(1),
    );
    // Stretch: most of the ring stays red/orange; only a thin ISCO band is gold
    const shaped = pow(heat, float(1.35));
    const warmerPeak = unitRange(peakTemperatureUnits, float(28), float(75));
    const t = clamp(
      shaped.mul(mix(float(0.85), float(1.08), warmerPeak)),
      float(0),
      float(1),
    );

    // Green kept deliberately low so later tonemap cannot clip to banana yellow
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
 * (Shakura–Sunyaev / multi-temperature disk; α ≈ 0.75).
 * Used for **brightness**, not the main hue driver.
 */
const diskTemperatureAtRadius = Fn(
  ([radius, innerRadius, peakTemperatureKelvin, alpha]) => {
    const r = max(radius, innerRadius);
    const ratio = max(innerRadius.div(r), float(1e-4));
    return peakTemperatureKelvin.mul(pow(ratio, alpha));
  },
);

/**
 * Emission from one mini-disk along a short path segment.
 *
 * Returns premultiplied RGB in .xyz and segment opacity in .w for
 * front-to-back compositing: C' = C + (1−α) c_step, α' = α + (1−α) α_step.
 */
const sampleMiniDisk = Fn(
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
    // Soft radial window: 1 inside [r_in, r_out], fades at the edges
    const inDisk = smoothstep(
      innerRadius.sub(0.05),
      innerRadius.add(0.05),
      cylindricalRadius,
    ).mul(
      smoothstep(
        outerRadius.add(0.08),
        outerRadius.sub(0.08),
        cylindricalRadius,
      ),
    );

    // Vertical density ~ exp(−(y/H)²) — gas concentrated near the midplane
    const H = max(scaleHeight, float(0.08));
    const yOverH = abs(height).div(H);
    const verticalDensity = exp(yOverH.mul(yOverH).mul(float(1.2)).negate());
    const verticalGate = smoothstep(float(0.008), float(0.2), verticalDensity);

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

    // heat ∈ (0,1]: hotter near ISCO → slightly brighter
    const heat = clamp(
      localT.div(max(peakKelvin, float(1))),
      float(0),
      float(1),
    );
    const brightness = accretionRate
      .mul(0.38)
      .mul(mix(float(0.75), float(1.2), heat))
      .mul(
        float(1).add(float(0.25).mul(smoothstep(float(0.7), float(1), heat))),
      )
      .mul(beamingFactor)
      .min(float(4.5)); // hard cap — prevents yellow blowout in tonemap

    // Outer rings stay opaque enough to read as red (not only the gold core)
    const opticalDepth = verticalDensity
      .mul(verticalGate)
      .mul(mix(float(0.95), float(1.15), heat))
      .mul(stepLength.mul(2.8))
      .mul(inDisk);

    const segmentOpacity = opticalDepth.min(float(0.55));
    return color.mul(brightness).mul(segmentOpacity).toVec4(segmentOpacity);
  },
);

// ── Pixel-art Bayer matrix ──────────────────────────────────────────────────

/**
 * Classic 4×4 Bayer ordered threshold in [0, 1).
 * Applied after color quantize for dithered pixel art.
 *
 * Values are the standard Bayer matrix × 1/16, indexed by floor(pixel) mod 4.
 */
const bayer4 = Fn(([px, py]) => {
  const x = floor(fract(px.div(4)).mul(4));
  const y = floor(fract(py.div(4)).mul(4));
  const odd = step(0.5, fract(x.mul(0.5)));
  // Each row: mix of two pairs selected by x and whether x is odd
  const r0 = mix(
    mix(float(0), float(8), odd),
    mix(float(2), float(10), odd),
    step(1.5, x),
  );
  const r1 = mix(
    mix(float(12), float(4), odd),
    mix(float(14), float(6), odd),
    step(1.5, x),
  );
  const r2 = mix(
    mix(float(3), float(11), odd),
    mix(float(1), float(9), odd),
    step(1.5, x),
  );
  const r3 = mix(
    mix(float(15), float(7), odd),
    mix(float(13), float(5), odd),
    step(1.5, x),
  );
  const col = mix(
    mix(r0, r1, step(0.5, y)),
    mix(r2, r3, step(2.5, y)),
    step(1.5, y),
  );
  return col.add(0.5).div(16);
});

// ── Main fragment ───────────────────────────────────────────────────────────

/**
 * Build the TSL color node attached to the inverted skydome material.
 */
export function createBlackHoleShader(uniforms: BlackHoleUniforms) {
  return Fn(() => {
    // ── 1. Binary masses & Kerr scales from CPU ───────────────────────────
    const M1 = uniforms.primaryMass;
    const M2 = uniforms.secondaryMass;
    const Mtot = max(uniforms.totalMass, M1.add(M2));
    const separation = max(uniforms.separation, float(2));
    const omega = uniforms.orbitalFrequency;

    const horizon1 = max(uniforms.eventHorizonPrimary, float(1e-3));
    const horizon2 = max(uniforms.eventHorizonSecondary, float(1e-3));
    const photon1 = max(uniforms.photonSpherePrimary, horizon1.mul(1.05));
    const photon2 = max(uniforms.photonSphereSecondary, horizon2.mul(1.05));
    const isco1 = max(uniforms.iscoPrimary, horizon1.mul(1.2));
    const isco2 = max(uniforms.iscoSecondary, horizon2.mul(1.2));

    // Two-body: lighter hole sits farther from the barycenter
    // r1 = d · M2/Mtot, r2 = d · M1/Mtot
    const arm1 = separation.mul(M2.div(Mtot));
    const arm2 = separation.mul(M1.div(Mtot));

    const phase = uniforms.time.mul(omega);
    const cP = cos(phase);
    const sP = sin(phase);

    // Orbit in the XZ plane (y = 0 is the disk midplane)
    const pos1 = vec3(cP.mul(arm1).negate(), float(0), sP.mul(arm1).negate());
    const pos2 = vec3(cP.mul(arm2), float(0), sP.mul(arm2));

    // ── 2. Pixel-snapped camera ray ───────────────────────────────────────
    const res = uniforms.resolution;
    const px = max(uniforms.pixelSize, float(1));
    // Snap fragment to center of its pixel cell
    const cell = floor(screenUV.mul(res).div(px)).mul(px).add(px.mul(0.5));
    const ndc = cell.div(res).sub(0.5).mul(2); // −1…1

    const aspect = res.x.div(max(res.y, float(1)));
    const tanHalf = tan(uniforms.cameraFov.mul(0.5).mul(PI.div(180)));

    const camPos = uniforms.cameraPosition;
    const camF = normalize(uniforms.cameraForward);
    const camR = normalize(uniforms.cameraRight);
    const camU = normalize(uniforms.cameraUp);

    const rayDir = normalize(
      camF
        .add(camR.mul(ndc.x.mul(aspect).mul(tanHalf)))
        .add(camU.mul(ndc.y.mul(tanHalf))),
    ).toVar("rayDir");

    const rayPos = camPos.toVar("rayPos");
    const prevPos = camPos.toVar("prevPos");
    const color = vec3(0, 0, 0).toVar("color");
    const alpha = float(0).toVar("alpha");
    const escaped = float(0).toVar("escaped");
    const captured = float(0).toVar("captured");
    // Closest approach to each hole (for soft silhouettes after the march)
    const minR1 = float(1e3).toVar("minR1");
    const minR2 = float(1e3).toVar("minR2");
    // Time spent near either photon sphere — stop multi-orbit “eye rings”
    const dwell = float(0).toVar("dwell");

    // Mini-disk bounds: ISCO → diskOuterRadiusM × Mᵢ
    const outerMul = max(uniforms.diskOuterRadiusM, float(3));
    const diskIn1 = isco1.mul(1.02);
    const diskOut1 = max(M1.mul(outerMul), diskIn1.mul(1.5));
    const diskIn2 = isco2.mul(1.02);
    const diskOut2 = max(M2.mul(outerMul), diskIn2.mul(1.5));
    const H = max(uniforms.diskScaleHeight, float(0.1));
    const stepBase = max(uniforms.stepSize, float(0.08));
    const escapeR = float(180);

    const peakT = uniforms.peakTemperature;
    const tempIdx = uniforms.temperatureIndex;
    const mdot = uniforms.accretionRate;

    // ── 3. Raymarch ───────────────────────────────────────────────────────
    Loop(80, () => {
      If(
        escaped
          .greaterThan(0.5)
          .or(captured.greaterThan(0.5))
          .or(alpha.greaterThan(0.99)),
        () => {
          Break();
        },
      );

      const off1 = rayPos.sub(pos1);
      const off2 = rayPos.sub(pos2);
      const r1 = length(off1);
      const r2 = length(off2);
      minR1.assign(min(minR1, r1));
      minR2.assign(min(minR2, r2));

      // Inside either event horizon → pure black forever
      If(
        r1.lessThan(horizon1.mul(1.02)).or(r2.lessThan(horizon2.mul(1.02))),
        () => {
          captured.assign(1);
          Break();
        },
      );

      const rCM = length(rayPos);
      If(rCM.greaterThan(escapeR), () => {
        escaped.assign(1);
        Break();
      });

      // Near photon sphere: light can loop; we accumulate dwell and give up
      // early so we never draw fake concentric multi-orbit rings.
      const nearPh = float(1).sub(
        min(
          smoothstep(photon1.mul(0.85), photon1.mul(2.2), r1),
          smoothstep(photon2.mul(0.85), photon2.mul(2.2), r2),
        ),
      );
      dwell.addAssign(nearPh);
      If(dwell.greaterThan(5), () => {
        captured.assign(1);
        Break();
      });

      // Adaptive step: fine near the disk plane / photon spheres, coarse far out
      const nearPlane = float(1).sub(
        smoothstep(float(0), float(1.5), abs(rayPos.y)),
      );
      const far = smoothstep(float(8), float(50), rCM);
      const dStep = mix(stepBase, max(stepBase, rCM.mul(0.14)), far)
        .mul(mix(float(1), float(0.4), nearPh))
        .mul(mix(float(1), float(0.55), nearPlane))
        .min(min(r1, r2).mul(0.3))
        .max(stepBase.mul(0.28));

      // Weak-field light bending toward each mass: Δd̂ ∝ (2M / r²) n̂ ds
      // (superposed Schwarzschild; no extra “lensing strength” fudge)
      const n1 = off1.negate().div(max(r1, float(1e-4)));
      const n2 = off2.negate().div(max(r2, float(1e-4)));
      const bend1 = M1.mul(2).div(r1.mul(r1)).mul(dStep);
      const bend2 = M2.mul(2).div(r2.mul(r2)).mul(dStep);
      rayDir.addAssign(n1.mul(bend1).add(n2.mul(bend2)));
      rayDir.assign(normalize(rayDir));

      prevPos.assign(rayPos);
      rayPos.addAssign(rayDir.mul(dStep));

      // Sample disks at the midpoint of the step (less banding on thin sheets)
      const mid = mix(prevPos, rayPos, float(0.5));
      const cyl1 = cylindricalRadiusXZ(mid, pos1);
      const cyl2 = cylindricalRadiusXZ(mid, pos2);

      // Mild left/right brightness from orbital phase (visual asymmetry)
      const beam1 = cos(atan(mid.z.sub(pos1.z), mid.x.sub(pos1.x)).sub(phase))
        .mul(0.25)
        .add(1);
      const beam2 = cos(atan(mid.z.sub(pos2.z), mid.x.sub(pos2.x)).sub(phase))
        .mul(0.25)
        .add(1);

      // Front-to-back alpha composite for both mini-disks
      If(alpha.lessThan(0.99), () => {
        const s = sampleMiniDisk(
          cyl1,
          mid.y,
          diskIn1,
          diskOut1,
          H,
          peakT,
          tempIdx,
          mdot,
          dStep,
          beam1,
        );
        const rem = float(1).sub(alpha);
        color.addAssign(s.xyz.mul(rem));
        alpha.addAssign(rem.mul(s.w));
      });
      If(alpha.lessThan(0.99), () => {
        const s = sampleMiniDisk(
          cyl2,
          mid.y,
          diskIn2,
          diskOut2,
          H,
          peakT,
          tempIdx,
          mdot,
          dStep,
          beam2,
        );
        const rem = float(1).sub(alpha);
        color.addAssign(s.xyz.mul(rem));
        alpha.addAssign(rem.mul(s.w));
      });
    });

    If(captured.lessThan(0.5), () => {
      escaped.assign(1);
    });

    // ── 4. Soft silhouettes from closest approach ─────────────────────────
    // Fade from black at r₊ out through the photon sphere (anti-aliased).
    const aa1 = max(fwidth(minR1).mul(1.2), horizon1.mul(0.04));
    const aa2 = max(fwidth(minR2).mul(1.2), horizon2.mul(0.04));
    const sil1 = float(1).sub(
      smoothstep(horizon1.sub(aa1), photon1.add(aa1.mul(0.4)), minR1),
    );
    const sil2 = float(1).sub(
      smoothstep(horizon2.sub(aa2), photon2.add(aa2.mul(0.4)), minR2),
    );
    const silhouette = max(sil1, sil2).toVar("silhouette");
    silhouette.assign(max(silhouette, captured.mul(0.95)));

    // ── 5. Tonemap (luma only) + fire chroma lock ─────────────────────────
    // Work in straight (non-premultiplied) color, compress brightness, then
    // re-apply hue. Cap G and B so orange never becomes solid yellow.
    const straight = color.div(max(alpha, float(1e-4))).toVar("straight");
    const lumaIn = max(
      dot(straight, vec3(0.2126, 0.7152, 0.0722)),
      float(1e-4),
    );
    const chroma = straight.div(lumaIn);
    const lumaOut = lumaIn.div(lumaIn.add(float(0.55))).mul(1.15);
    const toned = mix(
      vec3(lumaOut, lumaOut, lumaOut),
      chroma.mul(lumaOut),
      float(1.12),
    ).toVar("toned");
    toned.assign(
      vec3(
        toned.x,
        min(toned.y, toned.x.mul(0.72)),
        min(toned.z, toned.x.mul(0.25)),
      ),
    );

    const rgb = toned.mul(alpha).toVar("rgb");
    const peak = max(toned.x, max(toned.y, toned.z));
    // Where the silhouette is strong and the disk is dim, punch to black
    const brightCover = alpha.mul(smoothstep(float(0.02), float(0.3), peak));
    rgb.assign(
      mix(rgb, vec3(0, 0, 0), silhouette.mul(float(1).sub(brightCover))),
    );
    const matte = silhouette
      .mul(float(1).sub(smoothstep(float(0.05), float(0.35), peak)))
      .mul(smoothstep(float(0.15), float(0.85), alpha));
    rgb.assign(mix(rgb, vec3(0, 0, 0), matte.mul(0.85)));

    const outA = max(alpha, silhouette).toVar("outA");
    rgb.assign(clamp(rgb, float(0), float(1)));
    outA.assign(clamp(outA, float(0), float(1)));

    // ── 6. Pixel quantize + Bayer dither ──────────────────────────────────
    const levels = max(uniforms.colorLevels, float(2));
    const ditherAmt = clamp(uniforms.ditherStrength, float(0), float(1));
    const dither = bayer4(cell.x.div(px), cell.y.div(px))
      .sub(0.5)
      .mul(ditherAmt)
      .div(levels);
    const graded = rgb.add(vec3(dither, dither, dither)).toVar("graded");
    graded.assign(
      floor(clamp(graded, float(0), float(1)).mul(levels).add(0.5)).div(levels),
    );

    // Fully transparent empty sky — let the page background show through
    const peakCh = max(graded.x, max(graded.y, graded.z));
    Discard(outA.lessThan(0.002).and(peakCh.lessThan(0.002)));

    return graded.toVec4(outA);
  })();
}
