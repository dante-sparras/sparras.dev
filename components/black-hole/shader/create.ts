// @ts-nocheck
// Three.js TSL Fn() bodies are not accurately typed.

/**
 * Main binary black-hole fragment: local Kerr raymarch + T-driven disks + Doppler.
 *
 * IMPORTANT: Front-to-back disk composite must `addAssign` the outer
 * `toVar("color")` / `toVar("alpha")` nodes **inline**. Nested Fn parameters
 * do not write back parent accumulators in TSL (disks go black).
 *
 * Physics model (banner):
 * - Hole centers: Newtonian Ω = √(M/d³) in XZ
 * - Light: local Kerr null deflection (nearest / blended charts)
 * - Disks: T(r) → peach RGB; Doppler g = g_grav · g_sr; I ∝ g³
 */

import {
  vec3,
  float,
  Fn,
  length,
  normalize,
  dot,
  max,
  min,
  abs,
  tan,
  floor,
  smoothstep,
  mix,
  clamp,
  cos,
  sin,
  Loop,
  Break,
  If,
  Discard,
  screenUV,
} from "three/tsl";
import { MARCH, GRADE } from "./constants";
import { bayer4 } from "./bayer";
import {
  cylindricalRadiusXZ,
  sampleMiniDisk,
  orbitalApproachMu,
  diskDopplerG,
} from "./disk";
import { kerrNullDeflect } from "./geodesic";
import type { BlackHoleUniforms } from "./types";

const PI = float(Math.PI);
const DEG2RAD = PI.div(180);

/**
 * Build the TSL color node attached to the inverted skydome material.
 */
export function createBlackHoleShader(uniforms: BlackHoleUniforms) {
  return Fn(() => {
    // ── 1. Binary masses & Kerr scales from CPU ───────────────────────────
    const M1 = uniforms.primaryMass;
    const M2 = uniforms.secondaryMass;
    const Mtot = max(uniforms.totalMass, float(1e-4));
    const separation = max(uniforms.separation, float(2));
    const omega = uniforms.orbitalFrequency;
    const chi = uniforms.spin;

    const horizon1 = max(uniforms.eventHorizonPrimary, float(1e-3));
    const horizon2 = max(uniforms.eventHorizonSecondary, float(1e-3));
    // Photon floor slightly outside horizon if CPU scale is tiny
    const photon1 = max(uniforms.photonSpherePrimary, horizon1.mul(1.05));
    const photon2 = max(uniforms.photonSphereSecondary, horizon2.mul(1.05));
    const isco1 = max(uniforms.iscoPrimary, horizon1.mul(1.2));
    const isco2 = max(uniforms.iscoSecondary, horizon2.mul(1.2));

    const arm1 = separation.mul(M2.div(Mtot));
    const arm2 = separation.mul(M1.div(Mtot));

    const phase = uniforms.time.mul(omega);
    const cP = cos(phase);
    const sP = sin(phase);
    const pos1 = vec3(cP.mul(arm1).negate(), float(0), sP.mul(arm1).negate());
    const pos2 = vec3(cP.mul(arm2), float(0), sP.mul(arm2));

    // ── 2. Camera ray (host DPR owns pixel size) ──────────────────────────
    const res = uniforms.resolution;
    const cell = screenUV.mul(res);
    const ndc = screenUV.sub(0.5).mul(2);
    const aspect = res.x.div(max(res.y, float(1)));
    const tanHalf = tan(uniforms.cameraFov.mul(0.5).mul(DEG2RAD));

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
    const minR1 = float(1e3).toVar("minR1");
    const minR2 = float(1e3).toVar("minR2");
    const dwell = float(0).toVar("dwell");

    const outerMul = max(uniforms.diskOuterRadiusM, float(3));
    const diskIn1 = isco1.mul(1.02);
    const diskOut1 = max(M1.mul(outerMul), diskIn1.mul(1.5));
    const diskIn2 = isco2.mul(1.02);
    const diskOut2 = max(M2.mul(outerMul), diskIn2.mul(1.5));
    const H1 = max(uniforms.diskScaleHeightPrimary, float(0.1));
    const H2 = max(uniforms.diskScaleHeightSecondary, float(0.1));
    const stepBase = max(uniforms.stepSize, float(0.08));
    const escapeR = float(MARCH.escapeRadius);

    const peakT = uniforms.peakTemperature;
    const tempIdx = uniforms.temperatureIndex;
    const mdot = uniforms.accretionRate;

    // ── 3. Raymarch (local Kerr charts) ───────────────────────────────────
    Loop(MARCH.maxSteps, () => {
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

      // Near-photon dwell kills multi-orbit rings
      const nearPh = float(1).sub(
        min(
          smoothstep(photon1.mul(0.85), photon1.mul(2.2), r1),
          smoothstep(photon2.mul(0.85), photon2.mul(2.2), r2),
        ),
      );
      dwell.addAssign(nearPh);
      If(dwell.greaterThan(MARCH.dwellCapture), () => {
        captured.assign(1);
        Break();
      });

      // Adaptive step: finer near photon / disk plane, coarser far out
      const nearPlane = float(1).sub(
        smoothstep(float(0), float(1.5), abs(rayPos.y)),
      );
      const far = smoothstep(float(8), float(50), rCM);
      const dStep = mix(stepBase, max(stepBase, rCM.mul(0.14)), far)
        .mul(mix(float(1), float(0.4), nearPh))
        .mul(mix(float(1), float(0.55), nearPlane))
        .min(min(r1, r2).mul(0.3))
        .max(stepBase.mul(0.28));

      // Soft-blend two local Kerr charts by 1/r³
      const w1 = float(1).div(max(r1.mul(r1).mul(r1), float(1e-6)));
      const w2 = float(1).div(max(r2.mul(r2).mul(r2), float(1e-6)));
      const use1 = w1.div(max(w1.add(w2), float(1e-6)));
      const d1 = kerrNullDeflect(off1, rayDir, M1, chi, dStep);
      const d2 = kerrNullDeflect(off2, rayDir, M2, chi, dStep);
      rayDir.assign(normalize(mix(d2, d1, use1)));

      prevPos.assign(rayPos);
      rayPos.addAssign(rayDir.mul(dStep));

      const mid = mix(prevPos, rayPos, float(0.5));
      const cyl1 = cylindricalRadiusXZ(mid, pos1);
      const cyl2 = cylindricalRadiusXZ(mid, pos2);
      const mu1 = orbitalApproachMu(mid, pos1, rayDir);
      const mu2 = orbitalApproachMu(mid, pos2, rayDir);
      const g1 = diskDopplerG(cyl1, M1, chi, mu1);
      const g2 = diskDopplerG(cyl2, M2, chi, mu2);

      // Inline composite — see file header
      If(alpha.lessThan(0.99), () => {
        const s = sampleMiniDisk(
          cyl1,
          mid.y,
          diskIn1,
          diskOut1,
          H1,
          peakT,
          tempIdx,
          mdot,
          dStep,
          g1,
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
          H2,
          peakT,
          tempIdx,
          mdot,
          dStep,
          g2,
        );
        const rem = float(1).sub(alpha);
        color.addAssign(s.xyz.mul(rem));
        alpha.addAssign(rem.mul(s.w));
      });
    });

    If(captured.lessThan(0.5).and(escaped.lessThan(0.5)), () => {
      // Per-hole soft capture — never max(photon) (fattened smaller hole)
      const cap1 = photon1.mul(MARCH.softCapturePhotonMul);
      const cap2 = photon2.mul(MARCH.softCapturePhotonMul);
      If(minR1.lessThan(cap1).or(minR2.lessThan(cap2)), () => {
        captured.assign(1);
      });
      If(captured.lessThan(0.5), () => {
        escaped.assign(1);
      });
    });

    // ── 4. Soft silhouettes (horizon → partial photon) ────────────────────
    const camDist = max(length(camPos), float(1));
    const pxWorld = camDist
      .mul(tanHalf)
      .mul(float(2).div(max(res.y, float(1))))
      .mul(GRADE.silAaScreenPx);
    const aa1 = max(horizon1.mul(GRADE.silAaHorizonFrac), pxWorld);
    const aa2 = max(horizon2.mul(GRADE.silAaHorizonFrac), pxWorld);
    const silOut1 = mix(horizon1, photon1, float(GRADE.silPhotonMix));
    const silOut2 = mix(horizon2, photon2, float(GRADE.silPhotonMix));
    const sil1 = float(1).sub(
      smoothstep(horizon1.sub(aa1), silOut1.add(aa1.mul(0.25)), minR1),
    );
    const sil2 = float(1).sub(
      smoothstep(horizon2.sub(aa2), silOut2.add(aa2.mul(0.25)), minR2),
    );
    const silhouette = max(sil1, sil2).toVar("silhouette");
    silhouette.assign(max(silhouette, captured.mul(0.75)));

    // ── 5. Tonemap + fire chroma lock ─────────────────────────────────────
    const straight = color.div(max(alpha, float(1e-4)));
    const lumaIn = max(
      dot(straight, vec3(0.2126, 0.7152, 0.0722)),
      float(1e-4),
    );
    // Full chroma (mix amount was 1)
    const lumaOut = lumaIn
      .div(lumaIn.add(float(GRADE.tonemapSoft)))
      .mul(GRADE.tonemapGain);
    const toned = straight.div(lumaIn).mul(lumaOut).toVar("toned");
    toned.assign(
      vec3(
        toned.x,
        min(toned.y, toned.x.mul(GRADE.greenCapOfRed)),
        min(toned.z, toned.x.mul(GRADE.blueCapOfRed)),
      ),
    );

    const rgb = toned.mul(alpha).toVar("rgb");
    const peak = max(toned.x, max(toned.y, toned.z));
    // Keep disk RGB where bright; silhouettes fill empty sky near holes
    const brightCover = alpha.mul(
      smoothstep(float(GRADE.brightCoverLo), float(GRADE.brightCoverHi), peak),
    );
    rgb.assign(
      mix(rgb, vec3(0, 0, 0), silhouette.mul(float(1).sub(brightCover))),
    );

    const outA = max(alpha, silhouette).toVar("outA");
    rgb.assign(clamp(rgb, float(0), float(1)));
    outA.assign(clamp(outA, float(0), float(1)));

    // ── 6. Pixel quantize + Bayer dither ──────────────────────────────────
    const levels = max(uniforms.colorLevels, float(2));
    const ditherAmt = clamp(uniforms.ditherStrength, float(0), float(1));
    const dither = bayer4(cell.x, cell.y).sub(0.5).mul(ditherAmt).div(levels);
    const graded = rgb.add(vec3(dither, dither, dither)).toVar("graded");
    graded.assign(
      floor(clamp(graded, float(0), float(1)).mul(levels).add(0.5)).div(levels),
    );

    const peakCh = max(graded.x, max(graded.y, graded.z));
    Discard(
      outA.lessThan(GRADE.discardAlpha).and(peakCh.lessThan(GRADE.discardPeak)),
    );

    return graded.toVec4(outA);
  })();
}
