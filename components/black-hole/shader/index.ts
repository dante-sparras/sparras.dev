// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/**
 * Schwarzschild null geodesics (G = c = 1).
 *
 * Conserved E, L, L̂. Radial equation:
 *   (dr/dλ)² = E² − (1 − rs/r) L² / r²
 * Spatial momentum:
 *   k = ṙ r̂ + (L/r) (L̂ × r̂)
 *
 * Stabilizations (fixes concentric multi-orbit “eye” artifacts):
 * - Project position back onto the orbital plane each step
 * - Hysteresis on turning points (no rapid ṙ chatter)
 * - Kill unstable photon orbits after limited windings near r ≈ 1.5 rs
 * - Adaptive dλ with hard caps near the photon sphere
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

    // ── Camera ─────────────────────────────────────────────────────────────
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

    // ── Conserved quantities ───────────────────────────────────────────────
    const pos = camPos.toVar("pos");
    const r0 = max(length(pos), float(1.0e-3));
    const rHat0 = pos.div(r0);
    const kr0 = dot(k0, rHat0);

    const Lvec0 = cross(pos, k0);
    const L = length(Lvec0).toVar("L");
    const Lhat = mix(
      normalize(cross(k0, rHat0).add(vec3(0.0, 1.0e-4, 0.0))),
      Lvec0.div(max(L, float(1.0e-6))),
      step(float(1.0e-5), L),
    ).toVar("Lhat");

    // Keep position in orbital plane: pos ⟂ L̂ residual removed each step
    pos.assign(pos.sub(Lhat.mul(dot(pos, Lhat))));

    const f0 = float(1.0).sub(rs.div(r0)).max(float(1.0e-4));
    const E2 = kr0
      .mul(kr0)
      .add(f0.mul(L.mul(L)).div(r0.mul(r0)))
      .max(float(1.0e-8));
    const E = sqrt(E2);

    // +1 outbound / -1 inbound
    const krSign = float(1.0)
      .sub(step(kr0, float(0.0)).mul(2.0))
      .toVar("krSign");

    // Impact parameter b = L/E. Critical null b_c = √27 M = (3√3) M ≈ 2.598 rs?
    // Actually b_c = 3√3 M = (3√3/2) rs ≈ 2.598 rs for capture cross-section edge.
    // Photon sphere unstable orbit: b² = 27 M² = 6.75 rs²
    const b = L.div(max(E, float(1.0e-6)));
    const bCrit = M.mul(float(5.1961524)); // 3 * sqrt(3) * M

    const rayDir = k0.toVar("rayDir");
    const prevPos = pos.toVar("prevPos");

    const color = vec3(0.0, 0.0, 0.0).toVar("color");
    const alpha = float(0.0).toVar("alpha");
    const escaped = float(0.0).toVar("escaped");
    const captured = float(0.0).toVar("captured");
    const minR = float(1.0e6).toVar("minR");
    // Count steps spent near the photon sphere (unstable orbit detector)
    const photonDwell = float(0.0).toVar("photonDwell");

    const innerR = uniforms.diskInnerRadius;
    const outerR = uniforms.diskOuterRadius;
    const dλ0 = uniforms.stepSize.mul(uniforms.gravitationalLensing);

    Loop(180, () => {
      If(
        escaped
          .greaterThan(0.5)
          .or(captured.greaterThan(0.5))
          .or(alpha.greaterThan(0.995)),
        () => {
          Break();
        },
      );

      // Plane projection (kills out-of-plane drift → ring moiré)
      pos.assign(pos.sub(Lhat.mul(dot(pos, Lhat))));

      const r = max(length(pos), float(1.0e-4));
      minR.assign(min(minR, r));

      // Horizon
      If(r.lessThanEqual(rs.mul(1.002)), () => {
        captured.assign(1.0);
        Break();
      });

      // Escaped
      If(r.greaterThan(140.0).and(krSign.greaterThan(0.0)), () => {
        escaped.assign(1.0);
        Break();
      });
      If(r.greaterThan(200.0), () => {
        escaped.assign(1.0);
        Break();
      });

      // Unstable photon orbit: dwell near r≈1.5rs → capture (real geodesics diverge)
      const nearPhotonShell = smoothstep(
        photonR.mul(0.55),
        photonR.mul(0.9),
        r,
      ).mul(float(1.0).sub(smoothstep(photonR.mul(1.15), photonR.mul(1.8), r)));
      photonDwell.addAssign(nearPhotonShell);
      // Also critical impact parameters that skim the sphere
      const critical = float(1.0).sub(
        smoothstep(bCrit.mul(0.92), bCrit.mul(1.08), b),
      );
      If(
        photonDwell
          .greaterThan(14.0)
          .or(photonDwell.greaterThan(8.0).and(critical.greaterThan(0.5))),
        () => {
          captured.assign(1.0);
          Break();
        },
      );

      const rHat = pos.div(r);
      const f = float(1.0).sub(rs.div(r)).max(float(1.0e-5));
      const V = f.mul(L.mul(L)).div(r.mul(r));
      // Slight buffer so we don't chatter on the potential barrier
      const arg = E.mul(E).sub(V).toVar("arg");

      If(arg.lessThan(float(1.0e-7)), () => {
        // Turning point — reverse once
        krSign.mulAssign(float(-1.0));
        arg.assign(float(0.0));
      });

      const kr = krSign.mul(sqrt(max(arg, float(0.0))));
      const ePhi = cross(Lhat, rHat);
      // Ensure ePhi is unit (numerical)
      const ePhiN = normalize(ePhi.add(vec3(1.0e-8, 0.0, 0.0)));
      const k = rHat.mul(kr).add(ePhiN.mul(L.div(r)));
      rayDir.assign(normalize(k.add(vec3(0.0, 0.0, 1.0e-8))));

      // Adaptive affine step
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
      const nearPh = float(1.0).sub(
        smoothstep(photonR.mul(0.7), photonR.mul(2.8), r),
      );
      const nearHor = float(1.0).sub(smoothstep(rs, rs.mul(5.0), r));
      const refine = max(nearPh, nearHor.mul(0.85));
      // Cap max step so we never leap over the photon sphere
      const dλ = clamp(
        dλ0
          .mul(mix(float(1.0), float(0.05), refine))
          .mul(mix(float(1.0), float(0.3), nearDisk)),
        float(0.008),
        float(0.85),
      );

      prevPos.assign(pos);
      // Midpoint for disk sample
      const mid = pos.add(k.mul(dλ.mul(0.5)));
      // Full step
      pos.addAssign(k.mul(dλ));

      // Disk Beer–Lambert (only physical multi-crossing — no stamps)
      If(alpha.lessThan(0.995), () => {
        const mR = sqrt(mid.x.mul(mid.x).add(mid.z.mul(mid.z)));
        const mNorm = clamp(
          mR.sub(innerR).div(max(outerR.sub(innerR), float(1.0e-3))),
          float(0.0),
          float(1.0),
        );
        const h = uniforms.diskScaleHeight.mul(
          mix(float(0.4), float(1.55), pow(mNorm, float(0.6))),
        );
        const yH = abs(mid.y).div(max(h, float(1.0e-4)));
        const vert = exp(yH.mul(yH).mul(float(1.9)).negate());
        const inDisk = mR
          .greaterThanEqual(innerR)
          .and(mR.lessThanEqual(outerR))
          .and(vert.greaterThan(0.012));

        If(inDisk, () => {
          const hitAngle = atan(mid.z, mid.x);
          const disk = accretionDiskColor(mR, hitAngle, uniforms.time, rayDir);
          const sigma = pow(
            max(innerR.div(max(mR, innerR)), float(0.12)),
            float(0.5),
          );
          const dens = vert.mul(disk.w).mul(sigma).mul(float(3.2));
          const tau = dens.mul(dλ);
          const stepA = float(1.0).sub(exp(tau.negate())).min(float(1.0));
          const rem = float(1.0).sub(alpha);
          color.addAssign(disk.xyz.mul(stepA).mul(rem));
          alpha.addAssign(rem.mul(stepA));
        });
      });
    });

    // Shadow from closest approach (AA only)
    const aaW = max(fwidth(minR).mul(1.6), rs.mul(0.012));
    const shadow = float(1.0)
      .sub(smoothstep(rs.sub(aaW), photonR.add(aaW), minR))
      .toVar("shadow");
    If(captured.greaterThan(0.5), () => {
      shadow.assign(1.0);
    });
    // Critical rays that never decided: treat as captured (dark)
    If(photonDwell.greaterThan(10.0).and(escaped.lessThan(0.5)), () => {
      shadow.assign(max(shadow, float(0.85)));
      captured.assign(1.0);
    });

    If(captured.lessThan(0.5), () => {
      escaped.assign(1.0);
    });

    const skyT = float(1.0).sub(shadow).mul(float(1.0).sub(alpha));

    const bg = vec3(0.0, 0.0, 0.0).toVar("bg");
    If(escaped.greaterThan(0.5).and(skyT.greaterThan(0.001)), () => {
      If(uniforms.starsEnabled.greaterThan(0.5), () => {
        bg.addAssign(starField(rayDir));
      });
      If(uniforms.nebulaEnabled.greaterThan(0.5), () => {
        bg.addAssign(nebulaField(rayDir));
      });
    });

    const safeA = max(alpha, float(1.0e-4));
    const straight = color.div(safeA);
    const toned = max(straight, vec3(0.0))
      .div(max(straight, vec3(0.0)).add(vec3(0.85)))
      .mul(1.12);

    const diskPm = toned.mul(alpha);
    const sky = bg.mul(skyT).mul(float(4.5));
    const rgb = diskPm.add(sky).toVar("rgb");
    const outA = max(alpha, shadow).toVar("outA");

    const holeOnly = shadow.mul(float(1.0).sub(alpha));
    rgb.assign(mix(rgb, vec3(0.0, 0.0, 0.0), holeOnly));

    rgb.assign(clamp(rgb, float(0.0), float(1.08)));
    outA.assign(clamp(outA, float(0.0), float(1.0)));

    const luma = max(rgb.x, max(rgb.y, rgb.z));
    Discard(outA.lessThan(0.002).and(luma.lessThan(0.002)));

    return rgb.toVec4(outA);
  })();
}
