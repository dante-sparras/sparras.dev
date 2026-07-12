// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/**
 * Schwarzschild null geodesics (G = c = 1).
 *
 * Integrates the exact equatorial null radial equation in the ray’s plane:
 *   (dr/dλ)² = E² − (1 − rs/r) L² / r²
 *   k = ṙ r̂ + (L/r) (L̂ × r̂)
 * with E, L, L̂ conserved. Secondary disk images appear only when the geodesic
 * re-enters the slab (multi-crossing) — no fake photon-sphere stamps.
 *
 * Geometry: rs = 2M · photon sphere = 1.5 rs · ISCO = 3 rs
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

    // ── Camera rays (PerspectiveCamera vertical FOV) ───────────────────────
    const ndc = screenUV.sub(0.5).mul(2.0);
    const aspect = uniforms.resolution.x.div(
      max(uniforms.resolution.y, float(1.0)),
    );
    const tanHalf = tan(uniforms.cameraFov.mul(0.5).mul(PI.div(180.0)));

    const camPos = uniforms.cameraPosition;
    const camForward = normalize(uniforms.cameraTarget.sub(camPos));
    const worldUp = vec3(0.0, 1.0, 0.0);
    const upDot = abs(dot(camForward, worldUp));
    const safeUp = mix(worldUp, vec3(0.0, 0.0, 1.0), step(float(0.95), upDot));
    const camRight = normalize(cross(camForward, safeUp));
    const camUp = cross(camRight, camForward);

    const k0 = normalize(
      camForward
        .add(camRight.mul(ndc.x.mul(aspect).mul(tanHalf)))
        .add(camUp.mul(ndc.y.mul(tanHalf))),
    );

    // ── Conserved geodesic constants from initial data ─────────────────────
    const pos = camPos.toVar("pos");
    const rInit = max(length(pos), float(1.0e-3));
    const rHat0 = pos.div(rInit);
    const kr0 = dot(k0, rHat0);
    // Specific angular momentum L = |r × k| (Cartesian affine at large r)
    const Lvec = cross(pos, k0);
    const L = length(Lvec).toVar("L");
    // Plane normal (stable even if L≈0)
    const Lhat = mix(
      vec3(0.0, 1.0, 0.0),
      Lvec.div(max(L, float(1.0e-6))),
      step(float(1.0e-5), L),
    ).toVar("Lhat");

    // Energy from null radial equation at the camera:
    // E² = ṙ² + (1 − rs/r) L²/r²
    const f0 = float(1.0).sub(rs.div(rInit)).max(float(1.0e-4));
    const E2 = kr0
      .mul(kr0)
      .add(f0.mul(L.mul(L)).div(rInit.mul(rInit)))
      .max(float(1.0e-8));
    const E = sqrt(E2).toVar("E");

    // Sign of radial momentum (flips at turning points)
    const krSign = float(1.0)
      .sub(step(kr0, float(0.0)).mul(2.0))
      .toVar("krSign"); // +1 or -1

    // Direction for disk Doppler / sky (always unit spatial k)
    const rayDir = k0.toVar("rayDir");
    const prevPos = pos.toVar("prevPos");

    const color = vec3(0.0, 0.0, 0.0).toVar("color");
    const alpha = float(0.0).toVar("alpha");
    const escaped = float(0.0).toVar("escaped");
    const captured = float(0.0).toVar("captured");
    const minR = float(1.0e6).toVar("minR");

    const innerR = uniforms.diskInnerRadius;
    const outerR = uniforms.diskOuterRadius;

    // gravitationalLensing scales affine step (speed of integration / effective strength)
    // 1.0 = geometric units; slightly >1 tightens critical capture for banner FOV
    const dλ0 = uniforms.stepSize.mul(uniforms.gravitationalLensing);

    // ── Integrate null geodesic ────────────────────────────────────────────
    Loop(200, () => {
      If(
        escaped
          .greaterThan(0.5)
          .or(captured.greaterThan(0.5))
          .or(alpha.greaterThan(0.995)),
        () => {
          Break();
        },
      );

      const r = max(length(pos), float(1.0e-4));
      minR.assign(min(minR, r));

      // Horizon
      If(r.lessThanEqual(rs.mul(1.001)), () => {
        captured.assign(1.0);
        Break();
      });

      // Escaped (outbound and far)
      If(r.greaterThan(160.0).and(krSign.greaterThan(0.0)), () => {
        escaped.assign(1.0);
        Break();
      });
      If(r.greaterThan(220.0), () => {
        escaped.assign(1.0);
        Break();
      });

      const rHat = pos.div(r);
      const f = float(1.0).sub(rs.div(r)).max(float(1.0e-5));
      // Effective potential for null equatorial motion
      const V = f.mul(L.mul(L)).div(r.mul(r));
      const arg = E.mul(E).sub(V).toVar("arg");

      // Turning point: reverse radial momentum
      If(arg.lessThan(0.0), () => {
        krSign.mulAssign(float(-1.0));
        arg.assign(float(0.0));
      });

      const kr = krSign.mul(sqrt(arg));
      // Tangential: L̂ × r̂ has unit length (L ⟂ r always)
      const ePhi = cross(Lhat, rHat);
      // Spatial null momentum (affine)
      const k = rHat.mul(kr).add(ePhi.mul(L.div(r)));
      rayDir.assign(normalize(k));

      // Adaptive dλ: fine near photon sphere + disk midplane
      const cylR = sqrt(pos.x.mul(pos.x).add(pos.z.mul(pos.z)));
      const nR = clamp(
        cylR.sub(innerR).div(max(outerR.sub(innerR), float(1.0e-3))),
        float(0.0),
        float(1.0),
      );
      const scaleH = uniforms.diskScaleHeight.mul(
        mix(float(0.4), float(1.55), pow(nR, float(0.6))),
      );
      const nearDisk = float(1.0).sub(
        smoothstep(float(0.0), scaleH.mul(2.6), abs(pos.y)),
      );
      const nearPhoton = float(1.0).sub(
        smoothstep(photonR.mul(0.65), photonR.mul(3.2), r),
      );
      const nearHor = float(1.0).sub(smoothstep(rs, rs.mul(6.0), r));
      const refine = max(nearPhoton, nearHor.mul(0.9));
      const dλ = dλ0
        .mul(mix(float(1.0), float(0.055), refine))
        .mul(mix(float(1.0), float(0.28), nearDisk));

      // Half-step mid-point for disk sampling (and better geometry)
      prevPos.assign(pos);
      const mid = pos.add(k.mul(dλ.mul(0.5)));
      pos.addAssign(k.mul(dλ));

      // ── Volumetric disk along geodesic (Beer–Lambert) ───────────────────
      // Multi-crossing after wrap = higher-order images (no fake stamp).
      If(alpha.lessThan(0.995), () => {
        const samplePos = mid;
        const mR = sqrt(
          samplePos.x.mul(samplePos.x).add(samplePos.z.mul(samplePos.z)),
        );
        const mNorm = clamp(
          mR.sub(innerR).div(max(outerR.sub(innerR), float(1.0e-3))),
          float(0.0),
          float(1.0),
        );
        const h = uniforms.diskScaleHeight.mul(
          mix(float(0.4), float(1.55), pow(mNorm, float(0.6))),
        );
        const yH = abs(samplePos.y).div(max(h, float(1.0e-4)));
        const vert = exp(yH.mul(yH).mul(float(1.85)).negate());
        const inDisk = mR
          .greaterThanEqual(innerR)
          .and(mR.lessThanEqual(outerR))
          .and(vert.greaterThan(0.01));

        If(inDisk, () => {
          const hitAngle = atan(samplePos.z, samplePos.x);
          // Doppler uses local spatial direction of the null geodesic
          const disk = accretionDiskColor(mR, hitAngle, uniforms.time, rayDir);
          // Mild radial surface-density weight ∝ r^{−0.5}
          const sigma = pow(
            max(innerR.div(max(mR, innerR)), float(0.12)),
            float(0.5),
          );
          const dens = vert.mul(disk.w).mul(sigma).mul(float(3.4));
          // Path length ~ |k| dλ; |k| not unit under metric — use dλ scale
          const tau = dens.mul(dλ);
          const stepA = float(1.0).sub(exp(tau.negate())).min(float(1.0));
          const rem = float(1.0).sub(alpha);
          color.addAssign(disk.xyz.mul(stepA).mul(rem));
          alpha.addAssign(rem.mul(stepA));
        });
      });
    });

    // ── Shadow AA from closest approach (geometry only) ────────────────────
    const aaW = max(fwidth(minR).mul(1.75), rs.mul(0.014));
    const shadow = float(1.0)
      .sub(smoothstep(rs.sub(aaW), photonR.add(aaW), minR))
      .toVar("shadow");
    If(captured.greaterThan(0.5), () => {
      shadow.assign(1.0);
    });

    If(captured.lessThan(0.5), () => {
      escaped.assign(1.0);
    });

    // Transmittance to background
    const skyT = float(1.0).sub(shadow).mul(float(1.0).sub(alpha));

    // ── Lensed sky: celestial direction = final k (physical) ───────────────
    const bg = vec3(0.0, 0.0, 0.0).toVar("bg");
    If(escaped.greaterThan(0.5).and(skyT.greaterThan(0.001)), () => {
      If(uniforms.starsEnabled.greaterThan(0.5), () => {
        bg.addAssign(starField(rayDir));
      });
      If(uniforms.nebulaEnabled.greaterThan(0.5), () => {
        bg.addAssign(nebulaField(rayDir));
      });
    });

    // ── Composite ──────────────────────────────────────────────────────────
    const safeA = max(alpha, float(1.0e-4));
    const straight = color.div(safeA);
    const toned = max(straight, vec3(0.0))
      .div(max(straight, vec3(0.0)).add(vec3(0.85)))
      .mul(1.12);

    const diskPm = toned.mul(alpha);
    const sky = bg.mul(skyT).mul(float(4.5));
    const rgb = diskPm.add(sky).toVar("rgb");
    const outA = max(alpha, shadow).toVar("outA");

    // Pure black event-horizon silhouette behind the disk
    const holeOnly = shadow.mul(float(1.0).sub(alpha));
    rgb.assign(mix(rgb, vec3(0.0, 0.0, 0.0), holeOnly));

    rgb.assign(clamp(rgb, float(0.0), float(1.08)));
    outA.assign(clamp(outA, float(0.0), float(1.0)));

    const luma = max(rgb.x, max(rgb.y, rgb.z));
    Discard(outA.lessThan(0.002).and(luma.lessThan(0.002)));

    return rgb.toVec4(outA);
  })();
}
