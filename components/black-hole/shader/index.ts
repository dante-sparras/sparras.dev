// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/**
 * Schwarzschild null-ray march (TSL).
 *
 * Geometry (G = c = 1):
 *   rs = 2M
 *   photon sphere = 1.5 rs
 *   ISCO = 3 rs
 *
 * Light deflection uses the leading GR term ∇⊥ ~ (3/2) rs / r² toward the mass
 * (scaled by gravitationalLensing). Capture at the horizon r ≤ rs with soft AA.
 * Volumetric thin disk + Beer–Lambert; secondary wrap from photon-sphere annulus.
 */
import type { BlackHoleUniforms } from "../mesh";
import {
  vec3,
  float,
  Fn,
  length,
  normalize,
  cross,
  dot,
  atan,
  sqrt,
  pow,
  max,
  min,
  abs,
  exp,
  tan,
  smoothstep,
  step,
  mix,
  clamp,
  Loop,
  Break,
  If,
  Discard,
  screenUV,
  fwidth,
} from "three/tsl";
import { createStarField } from "./stars";
import { createNebulaField } from "./nebula";
import { createAccretionDiskColor } from "./disk";

const PI = float(Math.PI);

export function createBlackHoleShader(uniforms: BlackHoleUniforms) {
  const starField = createStarField(uniforms);
  const nebulaField = createNebulaField(uniforms);
  const accretionDiskColor = createAccretionDiskColor(uniforms);

  return Fn(() => {
    const M = uniforms.blackHoleMass;
    const rs = M.mul(2.0);
    const photonR = rs.mul(1.5);

    // ── Camera rays matching PerspectiveCamera vertical FOV ────────────────
    const ndc = screenUV.sub(0.5).mul(2.0);
    const aspect = uniforms.resolution.x.div(
      max(uniforms.resolution.y, float(1.0)),
    );
    // tan(fovY/2) in radians
    const tanHalf = tan(uniforms.cameraFov.mul(0.5).mul(PI.div(180.0)));

    const camPos = uniforms.cameraPosition;
    const camTarget = uniforms.cameraTarget;
    const camForward = normalize(camTarget.sub(camPos));
    const worldUp = vec3(0.0, 1.0, 0.0);
    // Fallback when looking nearly along world-up
    const upDot = abs(dot(camForward, worldUp));
    const safeUp = mix(worldUp, vec3(0.0, 0.0, 1.0), step(float(0.95), upDot));
    const camRight = normalize(cross(camForward, safeUp));
    const camUp = cross(camRight, camForward);

    const rayDir0 = normalize(
      camForward
        .add(camRight.mul(ndc.x.mul(aspect).mul(tanHalf)))
        .add(camUp.mul(ndc.y.mul(tanHalf))),
    ).toVar("rayDir0");
    const rayDir = rayDir0.toVar("rayDir");

    const rayPos = camPos.toVar("rayPos");
    const prevPos = camPos.toVar("prevPos");
    const color = vec3(0.0, 0.0, 0.0).toVar("color");
    const alpha = float(0.0).toVar("alpha");
    const escaped = float(0.0).toVar("escaped");
    const captured = float(0.0).toVar("captured");
    const minR = float(1.0e6).toVar("minR");

    const innerR = uniforms.diskInnerRadius;
    const outerR = uniforms.diskOuterRadius;

    // ── March ──────────────────────────────────────────────────────────────
    Loop(128, () => {
      If(
        escaped
          .greaterThan(0.5)
          .or(captured.greaterThan(0.5))
          .or(alpha.greaterThan(0.99)),
        () => {
          Break();
        },
      );

      const r = max(length(rayPos), float(1.0e-4));
      minR.assign(min(minR, r));

      // Horizon capture (true event horizon at rs)
      If(r.lessThan(rs.mul(0.995)), () => {
        captured.assign(1.0);
        Break();
      });

      If(r.greaterThan(120.0), () => {
        escaped.assign(1.0);
        Break();
      });

      const cylR = sqrt(rayPos.x.mul(rayPos.x).add(rayPos.z.mul(rayPos.z)));
      const normR = clamp(
        cylR.sub(innerR).div(max(outerR.sub(innerR), float(1.0e-3))),
        float(0.0),
        float(1.0),
      );
      // Thin near hole, mild outer flare (scale height ∝ r^0.6 visually)
      const scaleH = uniforms.diskScaleHeight.mul(
        mix(float(0.35), float(1.7), pow(normR, float(0.6))),
      );
      const absY = abs(rayPos.y);
      const radialGate = smoothstep(innerR.mul(0.96), innerR, cylR).mul(
        smoothstep(outerR.mul(1.04), outerR, cylR),
      );
      const nearDisk = radialGate.mul(
        float(1.0).sub(smoothstep(float(0.0), scaleH.mul(3.0), absY)),
      );

      // Adaptive step: fine near photon sphere + disk slab
      const nearHole = float(1.0).sub(smoothstep(rs.mul(1.0), rs.mul(12.0), r));
      const dt = uniforms.stepSize
        .mul(mix(float(1.0), float(0.08), nearHole))
        .mul(mix(float(1.0), float(0.28), nearDisk))
        .toVar("dt");

      // GR light deflection: leading term (3/2) rs / r² toward mass
      // (Schwarzschild null geodesic weak/strong hybrid used in many demos)
      const toCenter = rayPos.negate().div(r);
      const bend = rs
        .mul(1.5)
        .div(r.mul(r))
        .mul(dt)
        .mul(uniforms.gravitationalLensing);
      rayDir.addAssign(toCenter.mul(bend));
      rayDir.assign(normalize(rayDir));

      prevPos.assign(rayPos);
      rayPos.addAssign(rayDir.mul(dt));

      // Volumetric disk — Gaussian vertical density, Beer–Lambert
      If(alpha.lessThan(0.99), () => {
        const mid = mix(prevPos, rayPos, float(0.5));
        const mR = sqrt(mid.x.mul(mid.x).add(mid.z.mul(mid.z)));
        const mNorm = clamp(
          mR.sub(innerR).div(max(outerR.sub(innerR), float(1.0e-3))),
          float(0.0),
          float(1.0),
        );
        const mH = uniforms.diskScaleHeight.mul(
          mix(float(0.35), float(1.7), pow(mNorm, float(0.6))),
        );
        const yOverH = abs(mid.y).div(max(mH, float(1.0e-4)));
        const sharp = mix(float(2.4), float(1.3), mNorm);
        const vert = exp(yOverH.mul(yOverH).mul(sharp).negate());
        const inVol = mR
          .greaterThan(innerR)
          .and(mR.lessThan(outerR))
          .and(vert.greaterThan(0.012));

        If(inVol, () => {
          const hitAngle = atan(mid.z, mid.x);
          const diskResult = accretionDiskColor(
            mR,
            hitAngle,
            uniforms.time,
            rayDir,
          );
          // Optical depth ∝ density × opacity × path
          const dens = vert.mul(diskResult.w).mul(float(2.8));
          const optical = dens.mul(dt);
          const stepA = float(1.0).sub(exp(optical.negate())).min(float(1.0));
          const remainingAlpha = float(1.0).sub(alpha);
          color.addAssign(diskResult.xyz.mul(stepA).mul(remainingAlpha));
          alpha.addAssign(remainingAlpha.mul(stepA));
        });
      });
    });

    // ── Shadow / photon ring (physical radii) ──────────────────────────────
    const aaW = max(fwidth(minR).mul(2.0), rs.mul(0.018));
    // Soft shadow from just inside horizon → slightly outside photon sphere
    const softCapture = float(1.0)
      .sub(smoothstep(rs.sub(aaW), photonR.mul(1.05).add(aaW), minR))
      .toVar("softCapture");
    If(captured.greaterThan(0.5), () => {
      softCapture.assign(1.0);
    });
    // Deep core: only true capture / deep shadow — pure black
    const hardBlack = smoothstep(float(0.7), float(0.96), softCapture).toVar(
      "hardBlack",
    );

    // Photon-sphere annulus (critical curve) — secondary / Einstein ring seat
    const distPhoton = minR.sub(photonR).abs();
    const ringAnnulus = float(1.0)
      .sub(smoothstep(float(0.0), rs.mul(0.35), distPhoton))
      .toVar("ringAnnulus");
    const softFringe = softCapture.mul(float(1.0).sub(hardBlack));

    // Secondary wrap: physical annulus + soft fringe, no screen-space lobe bias
    // (screen bias bent the void when the camera tilted)
    const secondaryBand = float(1.0)
      .sub(hardBlack)
      .mul(max(ringAnnulus, softFringe.mul(0.75)))
      .toVar("secondaryBand");

    const secEmit = vec3(0.0, 0.0, 0.0).toVar("secEmit");
    const secAlpha = float(0.0).toVar("secAlpha");

    If(secondaryBand.greaterThan(0.03).and(alpha.lessThan(0.98)), () => {
      // Map impact → disk radius for higher-order image
      const secR = mix(
        innerR.mul(1.02),
        outerR.mul(0.65),
        clamp(minR.sub(rs).div(rs.mul(1.8)), float(0.0), float(1.0)),
      );
      const a0 = atan(rayDir.z, rayDir.x);
      const a1 = a0.add(PI);
      const secA = accretionDiskColor(secR, a0, uniforms.time, rayDir);
      const secB = accretionDiskColor(secR, a1, uniforms.time, rayDir);
      const secMix = mix(secA, secB, float(0.5));
      const w = secondaryBand.mul(float(1.0).sub(alpha)).mul(float(0.9));
      secEmit.addAssign(secMix.xyz.mul(secMix.w).mul(w).mul(1.4));
      secAlpha.addAssign(secMix.w.mul(w).mul(float(0.45)));

      // Second azimuth for far-side fill
      const sec2 = accretionDiskColor(
        mix(innerR.mul(1.05), outerR.mul(0.5), float(0.35)),
        a0.add(float(1.1)),
        uniforms.time,
        rayDir,
      );
      const w2 = secondaryBand.mul(float(0.45)).mul(float(1.0).sub(alpha));
      secEmit.addAssign(sec2.xyz.mul(sec2.w).mul(w2));
      secAlpha.addAssign(sec2.w.mul(w2).mul(float(0.35)));
    });

    {
      const rem = float(1.0).sub(alpha);
      color.addAssign(secEmit.mul(rem));
      alpha.addAssign(rem.mul(secAlpha).min(float(0.7)));
    }

    const skyOk = float(1.0).sub(softCapture);

    If(captured.lessThan(0.5), () => {
      escaped.assign(1.0);
    });

    // ── Sky ────────────────────────────────────────────────────────────────
    const starsCol = vec3(0.0, 0.0, 0.0).toVar("starsCol");
    const nebCol = vec3(0.0, 0.0, 0.0).toVar("nebCol");

    If(escaped.greaterThan(0.5).and(alpha.lessThan(0.99)), () => {
      If(uniforms.starsEnabled.greaterThan(0.5), () => {
        // Stabilize star dir under strong lensing (anti-flicker)
        const align = clamp(dot(rayDir0, rayDir), float(-1.0), float(1.0));
        const bendAmt = float(1.0).sub(align);
        const stabilize = smoothstep(float(0.03), float(0.4), bendAmt).mul(
          float(0.7),
        );
        const starDir = normalize(mix(rayDir, rayDir0, stabilize));
        starsCol.assign(
          mix(
            starField(rayDir),
            starField(starDir),
            stabilize.mul(0.85).add(0.15),
          ),
        );
      });
      If(uniforms.nebulaEnabled.greaterThan(0.5), () => {
        nebCol.assign(nebulaField(rayDir));
      });
    });

    // ── Grade + composite ──────────────────────────────────────────────────
    const diskA = alpha;
    const safeA = max(diskA, float(1.0e-4));
    const straight = color.div(safeA);
    const graded = pow(max(straight, vec3(0.0)), vec3(0.9));
    const toned = graded
      .div(graded.add(vec3(1.05)))
      .mul(1.22)
      .toVar("toned");

    // Brighten critical curve (photon ring)
    const photonAa = max(fwidth(minR).mul(2.0), rs.mul(0.02));
    const photonMask = float(1.0)
      .sub(smoothstep(float(0.0), photonAa.add(rs.mul(0.035)), distPhoton))
      .toVar("photonMask");
    toned.assign(mix(toned, toned.mul(1.18), photonMask.mul(0.65)));

    const diskPm = toned.mul(diskA).toVar("diskPm");
    const remaining = float(1.0).sub(diskA);
    const skyFade = pow(max(skyOk, float(0.0)), float(1.5));
    const skyW = remaining.mul(skyFade);

    const rgb = diskPm.toVar("rgb");
    const outAlpha = diskA.toVar("outAlpha");

    const diskEnergy = max(diskPm.x, max(diskPm.y, diskPm.z));
    const edgeGlow = fwidth(diskEnergy)
      .mul(1.6)
      .min(float(0.25))
      .mul(float(1.0).sub(hardBlack));
    rgb.addAssign(diskPm.mul(edgeGlow.mul(0.85)));
    outAlpha.assign(max(outAlpha, edgeGlow.mul(0.2)));

    // Einstein ring (warm, outside void)
    const ringCol = vec3(1.0, 0.94, 0.88);
    rgb.addAssign(
      ringCol.mul(photonMask.mul(0.5).mul(skyOk.add(diskA.mul(0.3)))),
    );
    rgb.addAssign(ringCol.mul(photonMask.mul(photonMask).mul(0.16).mul(skyOk)));
    outAlpha.assign(max(outAlpha, photonMask.mul(skyOk).mul(0.6)));

    If(uniforms.nebulaEnabled.greaterThan(0.5), () => {
      const n = nebCol.mul(skyW);
      rgb.addAssign(n);
      outAlpha.assign(
        max(outAlpha, max(n.x, max(n.y, n.z)).mul(2.0).min(float(1.0))),
      );
    });

    If(uniforms.starsEnabled.greaterThan(0.5), () => {
      const s = pow(max(starsCol, vec3(0.0)), vec3(0.9))
        .mul(5.5)
        .mul(skyW);
      rgb.addAssign(s);
      const sLuma = max(s.x, max(s.y, s.z));
      outAlpha.assign(
        max(outAlpha, max(sLuma.mul(8.0), step(float(1.0e-5), sLuma).mul(0.2))),
      );
    });

    // Pure black only in deep core, behind disk (disk stays in front)
    const holeBehind = hardBlack.mul(float(1.0).sub(diskA));
    rgb.assign(mix(rgb, vec3(0.0, 0.0, 0.0), holeBehind));
    const wrapLuma = max(rgb.x, max(rgb.y, rgb.z));
    const softHoleA = softCapture.mul(
      float(1.0).sub(smoothstep(float(0.02), float(0.12), wrapLuma)),
    );
    outAlpha.assign(max(outAlpha, max(hardBlack, softHoleA)));

    rgb.assign(clamp(rgb, float(0.0), float(1.05)));
    outAlpha.assign(clamp(outAlpha, float(0.0), float(1.0)));

    const luma = max(rgb.x, max(rgb.y, rgb.z));
    Discard(outAlpha.lessThan(0.002).and(luma.lessThan(0.002)));

    return rgb.toVec4(outAlpha);
  })();
}
