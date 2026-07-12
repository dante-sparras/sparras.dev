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
 *
 * Silhouette bugs fixed:
 * - Emission-weighted opacity (dim gas doesn't paint matte over the void)
 * - Thinner dens near hole so photon-ring wrap isn't occluded by primary slab
 * - Bright-cover composite (elevated-view “disk shadow” on lower lobe)
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
    const dwell = float(0.0).toVar("dwell");
    const photonR = rs.mul(1.5);

    const innerR = uniforms.diskInnerRadius;
    const outerR = uniforms.diskOuterRadius;
    const diskSpan = max(outerR.sub(innerR), float(1.0e-3));
    const stepSz = max(uniforms.stepSize, float(0.05));
    const escapeR = float(120.0);

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

      const r = length(rayPos);
      minR.assign(min(minR, r));

      If(r.lessThan(rs.mul(1.01)), () => {
        captured.assign(1.0);
        Break();
      });

      If(r.greaterThan(escapeR), () => {
        escaped.assign(1.0);
        Break();
      });

      const nearPhoton = float(1.0).sub(
        smoothstep(photonR.mul(0.9), photonR.mul(2.4), r),
      );
      dwell.addAssign(nearPhoton);
      // Kill multi-orbit concentric “eye” rings
      If(dwell.greaterThan(6.0), () => {
        captured.assign(1.0);
        Break();
      });

      const nearPlane = float(1.0).sub(
        smoothstep(float(0.0), float(1.2), abs(rayPos.y)),
      );
      const contactZone = nearPhoton.mul(nearPlane);
      const farBoost = smoothstep(float(6.0), float(35.0), r);
      const dBase = mix(stepSz, max(stepSz, r.mul(0.12)), farBoost);
      const dStep = dBase
        .mul(mix(float(1.0), float(0.42), nearPhoton))
        .mul(mix(float(1.0), float(0.52), nearPlane))
        .mul(mix(float(1.0), float(0.48), contactZone))
        .min(r.mul(0.28))
        .max(stepSz.mul(0.3));

      const toCenter = rayPos.negate().div(max(r, float(1.0e-4)));
      const bend = rs
        .div(r.mul(r))
        .mul(dStep)
        .mul(uniforms.gravitationalLensing);
      rayDir.addAssign(toCenter.mul(bend));
      rayDir.assign(normalize(rayDir));

      prevPos.assign(rayPos);
      rayPos.addAssign(rayDir.mul(dStep));

      const mid = mix(prevPos, rayPos, float(0.5));
      const mR = sqrt(mid.x.mul(mid.x).add(mid.z.mul(mid.z)));
      const inDiskR = mR.greaterThanEqual(innerR).and(mR.lessThanEqual(outerR));

      const crossed = prevPos.y.mul(rayPos.y).lessThan(float(0.0));
      If(crossed.and(inDiskR).and(crossings.lessThan(2.5)), () => {
        crossings.addAssign(float(1.0));
      });

      // ── Volumetric gas slab (flared Gaussian) ────────────────────────────
      const h0 = max(uniforms.diskScaleHeight, float(0.08));
      const hDisk = h0
        .mul(pow(max(mR.div(max(innerR, float(0.5))), float(0.6)), float(0.85)))
        .mul(
          mix(
            float(0.78),
            float(1.0),
            smoothstep(innerR, innerR.add(diskSpan.mul(0.35)), mR),
          ),
        );
      const vert = exp(
        abs(mid.y)
          .div(hDisk)
          .mul(abs(mid.y).div(hDisk))
          .mul(float(1.55))
          .negate(),
      );
      const vertGate = smoothstep(float(0.006), float(0.07), vert);

      // Near-hole: keep transmittance so bright wrap isn't occluded by a thick
      // dim primary slab (elevated views → dark “shadow” on lower silhouette).
      const nearHoleThin = float(1.0).sub(
        smoothstep(innerR.mul(0.9), outerR.mul(0.55), mR),
      );

      If(
        inDiskR
          .and(vertGate.greaterThan(0.02))
          .and(alpha.lessThan(0.985))
          .and(crossings.lessThan(2.5)),
        () => {
          const hitAngle = atan(mid.z, mid.x);
          const disk = accretionDiskColor(
            mR,
            hitAngle,
            mid.y,
            uniforms.time,
            rayDir,
          );
          const order = mix(
            float(1.0),
            float(0.72),
            step(float(1.5), crossings),
          );

          // Emission-weighted opacity: dim gas must not paint opaque matte
          const diskLuma = max(disk.x, max(disk.y, disk.z));
          const emitOcc = mix(
            float(0.12),
            float(1.0),
            smoothstep(float(0.015), float(0.45), diskLuma),
          );

          const thinNear = mix(float(1.0), float(0.42), nearHoleThin);
          const dens = vert
            .mul(vertGate)
            .mul(disk.w)
            .mul(float(0.78))
            .mul(dStep)
            .mul(order)
            .mul(thinNear)
            .mul(emitOcc);
          const stepA = dens.min(float(0.26));
          const rem = float(1.0).sub(alpha);
          color.addAssign(disk.xyz.mul(stepA).mul(rem));
          alpha.addAssign(rem.mul(stepA));
        },
      );
    });

    If(captured.lessThan(0.5), () => {
      escaped.assign(1.0);
    });

    // Soft shadow from continuous minR SDF — never hard-snap on capture
    const aaW = max(fwidth(minR).mul(2.0), rs.mul(0.015));
    const shadow = float(1.0)
      .sub(smoothstep(rs.sub(aaW), photonR.add(aaW.mul(0.55)), minR))
      .toVar("shadow");
    shadow.assign(max(shadow, captured.mul(0.9)));

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
      .div(max(straight, vec3(0.0)).add(vec3(0.55)))
      .mul(1.4);

    const diskPm = toned.mul(alpha);
    const sky = bg.mul(skyT).mul(float(5.0));
    const rgb = diskPm.add(sky).toVar("rgb");

    // Only *bright* disk covers pure black — dim high-α gas would leave a
    // dark band across the silhouette while blocking the photon-ring wrap.
    const tonedLuma = max(toned.x, max(toned.y, toned.z));
    const brightCover = alpha.mul(
      smoothstep(float(0.02), float(0.28), tonedLuma),
    );

    const skyLuma = max(sky.x, max(sky.y, sky.z));
    const outA = max(
      alpha,
      max(shadow, smoothstep(float(0.0), float(0.03), skyLuma)),
    ).toVar("outA");

    rgb.assign(
      mix(rgb, vec3(0.0, 0.0, 0.0), shadow.mul(float(1.0).sub(brightCover))),
    );
    // Kill residual grey matte over the void
    const matteKill = shadow
      .mul(float(1.0).sub(smoothstep(float(0.05), float(0.35), tonedLuma)))
      .mul(smoothstep(float(0.15), float(0.85), alpha));
    rgb.assign(mix(rgb, vec3(0.0, 0.0, 0.0), matteKill.mul(0.85)));

    rgb.assign(clamp(rgb, float(0.0), float(1.05)));
    outA.assign(clamp(outA, float(0.0), float(1.0)));

    const luma = max(rgb.x, max(rgb.y, rgb.z));
    Discard(outA.lessThan(0.002).and(luma.lessThan(0.002)));

    return rgb.toVec4(outA);
  })();
}
