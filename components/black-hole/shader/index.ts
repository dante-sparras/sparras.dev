// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/**
 * Black-hole raymarch — dgreenheck structure, R3F/site adaptations.
 *
 * Reference: https://github.com/dgreenheck/webgpu-black-hole
 * Blog: https://threejsroadmap.com/blog/raytracing-a-black-hole-with-webgpu
 *
 * Light bending (tutorial form):
 *   rayDir += normalize(-pos) * (rs / r²) * step * gravitationalLensing
 *
 * Disk: midplane crossings with front-to-back alpha (primary + secondary wrap).
 * Sky: stars + nebula on escaped rays with final lensed direction.
 *
 * Site pipeline:
 * - FOV-matched camera rays (not fixed fov=1)
 * - Camera axes from matrixWorld (stable when looking ±Y — no pole snap)
 * - Premultiplied RGBA + Discard void → CSS bg-background
 * - No post bloom; soft-knee grade in shader
 */

import type { BlackHoleUniforms } from "../mesh";
import {
  vec3,
  float,
  Fn,
  length,
  normalize,
  atan,
  sqrt,
  max,
  min,
  abs,
  tan,
  exp,
  pow,
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

    // ── Camera ray (axes from matrixWorld — no worldUp singularity at poles) ───
    const ndc = screenUV.sub(0.5).mul(2.0);
    const aspect = uniforms.resolution.x.div(
      max(uniforms.resolution.y, float(1.0)),
    );
    const tanHalf = tan(uniforms.cameraFov.mul(0.5).mul(PI.div(180.0)));

    const camPos = uniforms.cameraPosition;
    // Already orthonormal from Three.js camera; normalize for safety
    const camForward = normalize(uniforms.cameraForward);
    const camRight = normalize(uniforms.cameraRight);
    const camUp = normalize(uniforms.cameraUp);

    const rayDir = normalize(
      camForward
        .add(camRight.mul(ndc.x.mul(aspect).mul(tanHalf)))
        .add(camUp.mul(ndc.y.mul(tanHalf))),
    ).toVar("rayDir");

    // ── State ──────────────────────────────────────────────────────────────
    const rayPos = camPos.toVar("rayPos");
    const prevPos = camPos.toVar("prevPos");
    const color = vec3(0.0, 0.0, 0.0).toVar("color");
    const alpha = float(0.0).toVar("alpha");
    const escaped = float(0.0).toVar("escaped");
    const captured = float(0.0).toVar("captured");
    const minR = length(camPos).toVar("minR");
    const crossings = float(0.0).toVar("crossings");
    // Photon-orbit dwell — kills concentric multi-wind “eye” rings
    const dwell = float(0.0).toVar("dwell");
    const photonR = rs.mul(1.5);

    const innerR = uniforms.diskInnerRadius;
    const outerR = uniforms.diskOuterRadius;
    const stepSz = max(uniforms.stepSize, float(0.05));
    // Escape past the skydome / far field (camera maxDistance ≤ 50, dome r=100)
    const escapeR = float(120.0);

    // ── March ──────────────────────────────────────────────────────────────
    // Adaptive dStep: large strides far from the hole so zoomed-out cameras
    // still reach the disk (fixed 0.55×72 ≈ 40 units cut off at ~r=50).
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

      const r = length(rayPos);
      minR.assign(min(minR, r));

      // Horizon capture
      If(r.lessThan(rs.mul(1.01)), () => {
        captured.assign(1.0);
        Break();
      });

      // Far field
      If(r.greaterThan(escapeR), () => {
        escaped.assign(1.0);
        Break();
      });

      // Unstable photon orbit: real geodesics diverge — capture after short dwell
      const nearPhoton = float(1.0).sub(
        smoothstep(photonR.mul(0.9), photonR.mul(2.4), r),
      );
      dwell.addAssign(nearPhoton);
      If(dwell.greaterThan(10.0), () => {
        captured.assign(1.0);
        Break();
      });

      // Adaptive step: grow with r when far, shrink near photon sphere + midplane
      // Cap so we never leap over the horizon (max ~0.25 r)
      const nearPlane = float(1.0).sub(
        smoothstep(float(0.0), float(1.2), abs(rayPos.y)),
      );
      const farBoost = smoothstep(float(6.0), float(35.0), r);
      const dBase = mix(stepSz, max(stepSz, r.mul(0.12)), farBoost);
      const dStep = dBase
        .mul(mix(float(1.0), float(0.4), nearPhoton))
        .mul(mix(float(1.0), float(0.55), nearPlane))
        .min(r.mul(0.28))
        .max(stepSz.mul(0.35));

      // Gravitational bend: a ∝ rs/r² toward center
      const toCenter = rayPos.negate().div(max(r, float(1.0e-4)));
      const bend = rs
        .div(r.mul(r))
        .mul(dStep)
        .mul(uniforms.gravitationalLensing);
      rayDir.addAssign(toCenter.mul(bend));
      rayDir.assign(normalize(rayDir));

      prevPos.assign(rayPos);
      rayPos.addAssign(rayDir.mul(dStep));

      // Mid-step sample for smoother volume
      const mid = mix(prevPos, rayPos, float(0.5));
      const mR = sqrt(mid.x.mul(mid.x).add(mid.z.mul(mid.z)));
      const inDiskR = mR.greaterThanEqual(innerR).and(mR.lessThanEqual(outerR));

      // Track midplane crossings for secondary-image dimming only
      const crossed = prevPos.y.mul(rayPos.y).lessThan(float(0.0));
      If(crossed.and(inDiskR).and(crossings.lessThan(2.5)), () => {
        crossings.addAssign(float(1.0));
      });

      // ── Volumetric gas slab (flared Gaussian) ────────────────────────────
      // Sample every step inside the disk volume so it reads as flowing gas,
      // not a paper-thin plane. Secondary orbits dim; dwell already kills eyes.
      const h0 = max(uniforms.diskScaleHeight, float(0.08));
      // Flare: outer arms thicker (Interstellar hazy slab)
      const hDisk = h0.mul(
        pow(max(mR.div(max(innerR, float(0.5))), float(0.6)), float(0.85)),
      );
      const vert = exp(
        abs(mid.y)
          .div(hDisk)
          .mul(abs(mid.y).div(hDisk))
          .mul(float(1.6))
          .negate(),
      );

      If(
        inDiskR
          .and(vert.greaterThan(0.03))
          .and(alpha.lessThan(0.97))
          .and(crossings.lessThan(2.5)),
        () => {
          const hitAngle = atan(mid.z, mid.x);
          const disk = accretionDiskColor(mR, hitAngle, uniforms.time, rayDir);
          const order = mix(
            float(1.0),
            float(0.7),
            step(float(1.5), crossings),
          );
          const dens = vert.mul(disk.w).mul(float(1.1)).mul(dStep).mul(order);
          const stepA = dens.min(float(0.4));
          const rem = float(1.0).sub(alpha);
          color.addAssign(disk.xyz.mul(stepA).mul(rem));
          alpha.addAssign(rem.mul(stepA));
        },
      );
    });

    If(captured.lessThan(0.5), () => {
      escaped.assign(1.0);
    });

    // Soft shadow from closest approach (restored — pre rim-AA experiments)
    const aaW = max(fwidth(minR).mul(1.5), rs.mul(0.012));
    const shadow = float(1.0)
      .sub(smoothstep(rs.sub(aaW), photonR.add(aaW), minR))
      .toVar("shadow");
    If(captured.greaterThan(0.5), () => {
      shadow.assign(1.0);
    });

    // Background for escaped rays
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

    // Grade
    const safeA = max(alpha, float(1.0e-4));
    const straight = color.div(safeA);
    const toned = max(straight, vec3(0.0))
      .div(max(straight, vec3(0.0)).add(vec3(0.55)))
      .mul(1.35);

    const diskPm = toned.mul(alpha);
    const sky = bg.mul(skyT).mul(float(5.0));
    const rgb = diskPm.add(sky).toVar("rgb");
    const skyLuma = max(sky.x, max(sky.y, sky.z));
    const outA = max(
      alpha,
      max(shadow, smoothstep(float(0.0), float(0.03), skyLuma)),
    ).toVar("outA");

    // Soft composite: black only where shadow and disk don't cover
    // (disk secondary wrap stays visible over the silhouette)
    rgb.assign(
      mix(rgb, vec3(0.0, 0.0, 0.0), shadow.mul(float(1.0).sub(alpha))),
    );
    rgb.assign(clamp(rgb, float(0.0), float(1.05)));
    outA.assign(clamp(outA, float(0.0), float(1.0)));

    const luma = max(rgb.x, max(rgb.y, rgb.z));
    Discard(outA.lessThan(0.002).and(luma.lessThan(0.002)));

    return rgb.toVec4(outA);
  })();
}
