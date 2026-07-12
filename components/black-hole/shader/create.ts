// @ts-nocheck
// Three.js TSL Fn() bodies are not accurately typed.

/**
 * Main binary black-hole fragment: raymarch + silhouette + tonemap + quantize.
 *
 * IMPORTANT: Front-to-back disk composite must `addAssign` the outer
 * `toVar("color")` / `toVar("alpha")` nodes **inline**. Nested Fn parameters
 * do not write back parent accumulators in TSL (disks go black).
 */

import {
  vec3,
  float,
  Fn,
  length,
  normalize,
  dot,
  atan,
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
import { MARCH, DISK, GRADE } from "./constants";
import { bayer4 } from "./bayer";
import { cylindricalRadiusXZ, sampleMiniDisk } from "./disk";
import type { BlackHoleUniforms } from "./types";

const PI = float(Math.PI);

/**
 * Build the TSL color node attached to the inverted skydome material.
 */
export function createBlackHoleShader(uniforms: BlackHoleUniforms) {
  return Fn(() => {
    // ── 1. Binary masses & Kerr scales from CPU ───────────────────────────
    const M1 = uniforms.primaryMass;
    const M2 = uniforms.secondaryMass;
    const Mtot = max(uniforms.totalMass, float(1e-4));
    const separation = max(uniforms.separation, float(MARCH.separationFloor));
    const omega = uniforms.orbitalFrequency;
    // |χ| — mild near-hole bend boost (not full Kerr geodesics)
    const chiAbs = abs(uniforms.spin);

    const horizon1 = max(uniforms.eventHorizonPrimary, float(1e-3));
    const horizon2 = max(uniforms.eventHorizonSecondary, float(1e-3));
    const photon1 = max(
      uniforms.photonSpherePrimary,
      horizon1.mul(MARCH.photonFloorMul),
    );
    const photon2 = max(
      uniforms.photonSphereSecondary,
      horizon2.mul(MARCH.photonFloorMul),
    );
    const isco1 = max(uniforms.iscoPrimary, horizon1.mul(MARCH.iscoFloorMul));
    const isco2 = max(uniforms.iscoSecondary, horizon2.mul(MARCH.iscoFloorMul));

    const arm1 = separation.mul(M2.div(Mtot));
    const arm2 = separation.mul(M1.div(Mtot));

    const phase = uniforms.time.mul(omega);
    const cP = cos(phase);
    const sP = sin(phase);

    const pos1 = vec3(cP.mul(arm1).negate(), float(0), sP.mul(arm1).negate());
    const pos2 = vec3(cP.mul(arm2), float(0), sP.mul(arm2));

    // ── 2. Camera ray (DPR owns pixel size) ───────────────────────────────
    const res = uniforms.resolution;
    const cell = screenUV.mul(res);
    const ndc = screenUV.sub(0.5).mul(2);

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
    const minR1 = float(1e3).toVar("minR1");
    const minR2 = float(1e3).toVar("minR2");
    const dwell = float(0).toVar("dwell");

    const outerMul = max(uniforms.diskOuterRadiusM, float(MARCH.outerMulFloor));
    const diskIn1 = isco1.mul(MARCH.diskInnerPad);
    const diskOut1 = max(M1.mul(outerMul), diskIn1.mul(MARCH.diskOuterMinMul));
    const diskIn2 = isco2.mul(MARCH.diskInnerPad);
    const diskOut2 = max(M2.mul(outerMul), diskIn2.mul(MARCH.diskOuterMinMul));
    const H1 = max(
      uniforms.diskScaleHeightPrimary,
      float(MARCH.scaleHeightFloor),
    );
    const H2 = max(
      uniforms.diskScaleHeightSecondary,
      float(MARCH.scaleHeightFloor),
    );
    const stepBase = max(uniforms.stepSize, float(MARCH.stepBaseFloor));
    const escapeR = float(MARCH.escapeRadius);

    const peakT = uniforms.peakTemperature;
    const tempIdx = uniforms.temperatureIndex;
    const mdot = uniforms.accretionRate;

    // ── 3. Raymarch ───────────────────────────────────────────────────────
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
        r1
          .lessThan(horizon1.mul(MARCH.horizonPad))
          .or(r2.lessThan(horizon2.mul(MARCH.horizonPad))),
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

      const nearPh = float(1).sub(
        min(
          smoothstep(
            photon1.mul(MARCH.nearPhotonInner),
            photon1.mul(MARCH.nearPhotonOuter),
            r1,
          ),
          smoothstep(
            photon2.mul(MARCH.nearPhotonInner),
            photon2.mul(MARCH.nearPhotonOuter),
            r2,
          ),
        ),
      );
      dwell.addAssign(nearPh);
      If(dwell.greaterThan(MARCH.dwellCapture), () => {
        captured.assign(1);
        Break();
      });

      const nearPlane = float(1).sub(
        smoothstep(float(0), float(MARCH.nearPlaneHeight), abs(rayPos.y)),
      );
      const far = smoothstep(float(MARCH.farStart), float(MARCH.farEnd), rCM);
      const dStep = mix(
        stepBase,
        max(stepBase, rCM.mul(MARCH.farStepFrac)),
        far,
      )
        .mul(mix(float(1), float(MARCH.nearPhotonStepMul), nearPh))
        .mul(mix(float(1), float(MARCH.nearPlaneStepMul), nearPlane))
        .min(min(r1, r2).mul(MARCH.stepRLimit))
        .max(stepBase.mul(MARCH.stepMinMul));

      const n1 = off1.negate().div(max(r1, float(1e-4)));
      const n2 = off2.negate().div(max(r2, float(1e-4)));
      // Schwarzschild base ∝ 2M/r²; near photon sphere, boost slightly with |χ|
      const spinProx1 = float(1).sub(
        smoothstep(
          photon1.mul(MARCH.spinBendInnerMul),
          photon1.mul(MARCH.spinBendOuterMul),
          r1,
        ),
      );
      const spinProx2 = float(1).sub(
        smoothstep(
          photon2.mul(MARCH.spinBendInnerMul),
          photon2.mul(MARCH.spinBendOuterMul),
          r2,
        ),
      );
      const boost1 = float(1).add(
        chiAbs.mul(MARCH.spinBendBoost).mul(spinProx1),
      );
      const boost2 = float(1).add(
        chiAbs.mul(MARCH.spinBendBoost).mul(spinProx2),
      );
      const bend1 = M1.mul(2).div(r1.mul(r1)).mul(dStep).mul(boost1);
      const bend2 = M2.mul(2).div(r2.mul(r2)).mul(dStep).mul(boost2);
      rayDir.addAssign(n1.mul(bend1).add(n2.mul(bend2)));
      rayDir.assign(normalize(rayDir));

      prevPos.assign(rayPos);
      rayPos.addAssign(rayDir.mul(dStep));

      const mid = mix(prevPos, rayPos, float(0.5));
      const cyl1 = cylindricalRadiusXZ(mid, pos1);
      const cyl2 = cylindricalRadiusXZ(mid, pos2);

      const beam1 = cos(atan(mid.z.sub(pos1.z), mid.x.sub(pos1.x)).sub(phase))
        .mul(DISK.beamAmp)
        .add(1);
      const beam2 = cos(atan(mid.z.sub(pos2.z), mid.x.sub(pos2.x)).sub(phase))
        .mul(DISK.beamAmp)
        .add(1);

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
          H2,
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

    If(captured.lessThan(0.5).and(escaped.lessThan(0.5)), () => {
      const nearEither = min(minR1, minR2);
      const captureR = max(photon1, photon2).mul(MARCH.softCapturePhotonMul);
      If(nearEither.lessThan(captureR), () => {
        captured.assign(1);
      });
      If(captured.lessThan(0.5), () => {
        escaped.assign(1);
      });
    });

    // ── 4. Soft silhouettes ───────────────────────────────────────────────
    const camDist = max(length(camPos), float(1));
    const pxWorld = camDist
      .mul(tanHalf)
      .mul(float(2).div(max(res.y, float(1))))
      .mul(GRADE.silAaScreenPx);
    const aa1 = max(horizon1.mul(GRADE.silAaHorizonFrac), pxWorld);
    const aa2 = max(horizon2.mul(GRADE.silAaHorizonFrac), pxWorld);
    const sil1 = float(1).sub(
      smoothstep(horizon1.sub(aa1), photon1.add(aa1.mul(0.4)), minR1),
    );
    const sil2 = float(1).sub(
      smoothstep(horizon2.sub(aa2), photon2.add(aa2.mul(0.4)), minR2),
    );
    const silhouette = max(sil1, sil2).toVar("silhouette");
    silhouette.assign(max(silhouette, captured.mul(0.95)));

    // ── 5. Tonemap + fire chroma lock ─────────────────────────────────────
    const straight = color.div(max(alpha, float(1e-4))).toVar("straight");
    const lumaIn = max(
      dot(straight, vec3(0.2126, 0.7152, 0.0722)),
      float(1e-4),
    );
    const chroma = straight.div(lumaIn);
    const lumaOut = lumaIn
      .div(lumaIn.add(float(GRADE.tonemapSoft)))
      .mul(GRADE.tonemapGain);
    const toned = mix(
      vec3(lumaOut, lumaOut, lumaOut),
      chroma.mul(lumaOut),
      float(GRADE.chromaMix),
    ).toVar("toned");
    toned.assign(
      vec3(
        toned.x,
        min(toned.y, toned.x.mul(GRADE.greenCapOfRed)),
        min(toned.z, toned.x.mul(GRADE.blueCapOfRed)),
      ),
    );

    const rgb = toned.mul(alpha).toVar("rgb");
    const peak = max(toned.x, max(toned.y, toned.z));
    const brightCover = alpha.mul(
      smoothstep(float(GRADE.brightCoverLo), float(GRADE.brightCoverHi), peak),
    );
    rgb.assign(
      mix(rgb, vec3(0, 0, 0), silhouette.mul(float(1).sub(brightCover))),
    );
    const matte = silhouette
      .mul(
        float(1).sub(
          smoothstep(float(GRADE.mattePeakLo), float(GRADE.mattePeakHi), peak),
        ),
      )
      .mul(
        smoothstep(float(GRADE.matteAlphaLo), float(GRADE.matteAlphaHi), alpha),
      );
    rgb.assign(mix(rgb, vec3(0, 0, 0), matte.mul(GRADE.matteStrength)));

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
