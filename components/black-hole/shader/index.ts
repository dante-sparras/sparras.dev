// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/**
 * Schwarzschild null-ray march (minimal hacks).
 *
 * Geometry (G = c = 1):
 *   rs = 2M · photon sphere = 1.5 rs · ISCO = 3 rs
 *
 * Integrator: adaptive step + light deflection
 *   Δk ∝ (3/2) rs r̂ / r²  (leading GR null term, × gravitationalLensing)
 *
 * Disk: volumetric Gaussian slab, Beer–Lambert. Secondary / Einstein structure
 * comes only from rays that bend and re-enter the slab (multi-crossing) — no
 * fake photon-sphere disk stamp, no painted ring, no screen-space lobes.
 *
 * Composite: march PM color + alpha; pure black if captured; lensed sky if free.
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

    // ── Pinhole rays = PerspectiveCamera vertical FOV ───────────────────────
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

    const rayDir = normalize(
      camForward
        .add(camRight.mul(ndc.x.mul(aspect).mul(tanHalf)))
        .add(camUp.mul(ndc.y.mul(tanHalf))),
    ).toVar("rayDir");

    const rayPos = camPos.toVar("rayPos");
    const prevPos = camPos.toVar("prevPos");
    // Premultiplied emission accumulator + opacity
    const color = vec3(0.0, 0.0, 0.0).toVar("color");
    const alpha = float(0.0).toVar("alpha");
    const escaped = float(0.0).toVar("escaped");
    const captured = float(0.0).toVar("captured");
    const minR = float(1.0e6).toVar("minR");

    const innerR = uniforms.diskInnerRadius;
    const outerR = uniforms.diskOuterRadius;

    // ── Null geodesic march ────────────────────────────────────────────────
    // Enough steps for photon-sphere wraps → natural multi-order disk images.
    Loop(192, () => {
      If(
        escaped
          .greaterThan(0.5)
          .or(captured.greaterThan(0.5))
          .or(alpha.greaterThan(0.995)),
        () => {
          Break();
        },
      );

      const r = max(length(rayPos), float(1.0e-4));
      minR.assign(min(minR, r));

      // Event horizon
      If(r.lessThanEqual(rs), () => {
        captured.assign(1.0);
        Break();
      });

      // Escaped to infinity
      If(r.greaterThan(150.0), () => {
        escaped.assign(1.0);
        Break();
      });

      // Adaptive λ-step: resolve photon sphere + thin disk
      const cylR = sqrt(rayPos.x.mul(rayPos.x).add(rayPos.z.mul(rayPos.z)));
      const mNorm = clamp(
        cylR.sub(innerR).div(max(outerR.sub(innerR), float(1.0e-3))),
        float(0.0),
        float(1.0),
      );
      const scaleH = uniforms.diskScaleHeight.mul(
        mix(float(0.4), float(1.6), pow(mNorm, float(0.6))),
      );
      const nearDisk = float(1.0).sub(
        smoothstep(float(0.0), scaleH.mul(2.8), abs(rayPos.y)),
      );
      // Stronger refinement near photon sphere (critical curve)
      const nearPhoton = float(1.0).sub(
        smoothstep(photonR.mul(0.7), photonR.mul(3.5), r),
      );
      const nearHorizon = float(1.0).sub(
        smoothstep(rs.mul(1.0), rs.mul(8.0), r),
      );
      const refine = max(nearPhoton, nearHorizon.mul(0.85));
      const dt = uniforms.stepSize
        .mul(mix(float(1.0), float(0.06), refine))
        .mul(mix(float(1.0), float(0.3), nearDisk))
        .toVar("dt");

      // Deflection: (3/2) rs / r² toward the mass (null GR leading term)
      const rHat = rayPos.div(r);
      const bend = rs
        .mul(1.5)
        .div(r.mul(r))
        .mul(dt)
        .mul(uniforms.gravitationalLensing);
      // k ← k − bend * r̂  (pulls null direction toward mass)
      rayDir.assign(normalize(rayDir.sub(rHat.mul(bend))));

      prevPos.assign(rayPos);
      rayPos.addAssign(rayDir.mul(dt));

      // ── Disk volume (Beer–Lambert). Multiple crossings = higher-order images.
      If(alpha.lessThan(0.995), () => {
        const mid = mix(prevPos, rayPos, float(0.5));
        const mR = sqrt(mid.x.mul(mid.x).add(mid.z.mul(mid.z)));
        const nR = clamp(
          mR.sub(innerR).div(max(outerR.sub(innerR), float(1.0e-3))),
          float(0.0),
          float(1.0),
        );
        const h = uniforms.diskScaleHeight.mul(
          mix(float(0.4), float(1.6), pow(nR, float(0.6))),
        );
        const yH = abs(mid.y).div(max(h, float(1.0e-4)));
        // sech²-like vertical structure via Gaussian
        const vert = exp(yH.mul(yH).mul(float(1.8)).negate());
        const inDisk = mR
          .greaterThanEqual(innerR)
          .and(mR.lessThanEqual(outerR))
          .and(vert.greaterThan(0.01));

        If(inDisk, () => {
          const hitAngle = atan(mid.z, mid.x);
          const disk = accretionDiskColor(mR, hitAngle, uniforms.time, rayDir);
          // Σ-like radial weight: denser inward (∝ r^−0.5 mild)
          const sigma = pow(
            max(innerR.div(max(mR, innerR)), float(0.15)),
            float(0.5),
          );
          // Optical depth this segment
          const dens = vert.mul(disk.w).mul(sigma).mul(float(3.2));
          const tau = dens.mul(dt);
          const stepA = float(1.0).sub(exp(tau.negate())).min(float(1.0));
          const rem = float(1.0).sub(alpha);
          // Emission * transmittance (front-to-back PM)
          color.addAssign(disk.xyz.mul(stepA).mul(rem));
          alpha.addAssign(rem.mul(stepA));
        });
      });
    });

    // ── Shadow mask from closest approach (AA only — no painted fill) ─────
    const aaW = max(fwidth(minR).mul(1.8), rs.mul(0.015));
    // Soft edge of the BH shadow: between horizon and photon sphere
    const shadow = float(1.0)
      .sub(smoothstep(rs.sub(aaW), photonR.add(aaW), minR))
      .toVar("shadow");
    If(captured.greaterThan(0.5), () => {
      shadow.assign(1.0);
    });

    // Free sky only if not captured
    If(captured.lessThan(0.5), () => {
      escaped.assign(1.0);
    });
    const skyT = float(1.0).sub(shadow).mul(float(1.0).sub(alpha));

    // ── Lensed background ──────────────────────────────────────────────────
    const bg = vec3(0.0, 0.0, 0.0).toVar("bg");
    If(escaped.greaterThan(0.5).and(skyT.greaterThan(0.001)), () => {
      // Direction at escape is the lensed celestial direction (physical)
      If(uniforms.starsEnabled.greaterThan(0.5), () => {
        bg.addAssign(starField(rayDir));
      });
      If(uniforms.nebulaEnabled.greaterThan(0.5), () => {
        bg.addAssign(nebulaField(rayDir));
      });
    });

    // ── Composite ──────────────────────────────────────────────────────────
    // color is already front-to-back PM disk emission
    const safeA = max(alpha, float(1.0e-4));
    const straight = color.div(safeA);
    // Soft-knee display map (HDR → display)
    const toned = max(straight, vec3(0.0))
      .div(max(straight, vec3(0.0)).add(vec3(0.85)))
      .mul(1.12);

    const diskPm = toned.mul(alpha);
    // Sky through remaining transmittance, killed by shadow
    const sky = bg.mul(skyT).mul(float(4.5));

    const rgb = diskPm.add(sky).toVar("rgb");
    // Opacity: disk + opaque black hole shadow (disk in front stays lit)
    const outA = max(alpha, shadow).toVar("outA");

    // Empty sky → transparent (CSS background)
    // Shadow with no disk → pure black (premul 0, a = shadow)
    const holeOnly = shadow.mul(float(1.0).sub(alpha));
    rgb.assign(mix(rgb, vec3(0.0, 0.0, 0.0), holeOnly));

    rgb.assign(clamp(rgb, float(0.0), float(1.08)));
    outA.assign(clamp(outA, float(0.0), float(1.0)));

    const luma = max(rgb.x, max(rgb.y, rgb.z));
    Discard(outA.lessThan(0.002).and(luma.lessThan(0.002)));

    return rgb.toVec4(outA);
  })();
}
