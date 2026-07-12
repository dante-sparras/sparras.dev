// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/**
 * Schwarzschild raymarch (dgreenheck port) — Three.js TSL.
 * Export: createBlackHoleShader(uniforms) → fragmentNode for MeshBasicNodeMaterial.
 */
import type { BlackHoleUniforms } from "../mesh";
import {
  vec2,
  vec3,
  float,
  Fn,
  length,
  normalize,
  cross,
  atan,
  sqrt,
  pow,
  max,
  min,
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

// Main raymarching shader
export function createBlackHoleShader(uniforms: BlackHoleUniforms) {
  const starField = createStarField(uniforms);
  const nebulaField = createNebulaField(uniforms);
  const accretionDiskColor = createAccretionDiskColor(uniforms);

  return Fn(() => {
    const rs = uniforms.blackHoleMass.mul(2.0); // Schwarzschild radius

    // Camera setup
    const uv = screenUV.sub(0.5).mul(2.0);
    const aspect = uniforms.resolution.x.div(uniforms.resolution.y);
    const screenPos = vec2(uv.x.mul(aspect), uv.y);

    const camPos = uniforms.cameraPosition;
    const camTarget = uniforms.cameraTarget;
    // Match Three.js lookAt: right = cross(forward, up), camUp = cross(right, forward)
    // (was cross(up, forward) → mirrored X / skewed silhouette)
    const camForward = normalize(camTarget.sub(camPos));
    const worldUp = vec3(0.0, 1.0, 0.0);
    const camRight = normalize(cross(camForward, worldUp));
    const camUp = cross(camRight, camForward);

    const fov = float(1.0);
    const rayDir0 = normalize(
      camForward
        .mul(fov)
        .add(camRight.mul(screenPos.x))
        .add(camUp.mul(screenPos.y)),
    ).toVar("rayDir0");
    // March mutates rayDir; keep rayDir0 for stable star lookups under lensing.
    const rayDir = rayDir0.toVar("rayDir");

    // Ray state
    const rayPos = camPos.toVar("rayPos");
    const prevPos = camPos.toVar("prevPos");
    const color = vec3(0.0, 0.0, 0.0).toVar("color");
    const alpha = float(0.0).toVar("alpha");
    const escaped = float(0.0).toVar("escaped");
    const captured = float(0.0).toVar("captured");
    // Closest approach — soft photon-ring / horizon AA
    const minR = float(1.0e6).toVar("minR");

    const innerR = uniforms.diskInnerRadius;
    const outerR = uniforms.diskOuterRadius;

    // More steps + adaptive size near hole → smoother critical curve when zoomed out
    Loop(96, () => {
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

      // Hard capture only deep inside (soft edge at composite)
      If(r.lessThan(rs.mul(0.9)), () => {
        captured.assign(1.0);
        Break();
      });

      If(r.greaterThan(100.0), () => {
        escaped.assign(1.0);
        Break();
      });

      // Much finer steps near the hole — thin photon ring aliases badly at coarse steps
      const nearHole = float(1.0).sub(
        smoothstep(rs.mul(1.05), rs.mul(14.0), r),
      );
      const dt = uniforms.stepSize.mul(mix(float(1.0), float(0.12), nearHole));

      const toCenter = rayPos.negate().div(r);
      const bendStrength = rs
        .div(r.mul(r))
        .mul(dt)
        .mul(uniforms.gravitationalLensing);
      rayDir.addAssign(toCenter.mul(bendStrength));
      rayDir.assign(normalize(rayDir));

      prevPos.assign(rayPos);
      rayPos.addAssign(rayDir.mul(dt));

      const crossedPlane = prevPos.y.mul(rayPos.y).lessThan(0.0);

      If(crossedPlane.and(alpha.lessThan(0.99)), () => {
        // Segment parameter must stay in [0,1]
        const tHit = clamp(
          prevPos.y.negate().div(rayPos.y.sub(prevPos.y)),
          float(0.0),
          float(1.0),
        );
        const hitPos = mix(prevPos, rayPos, tHit);
        const hitR = sqrt(hitPos.x.mul(hitPos.x).add(hitPos.z.mul(hitPos.z)));
        const inDisk = hitR.greaterThan(innerR).and(hitR.lessThan(outerR));

        If(inDisk, () => {
          const hitAngle = atan(hitPos.z, hitPos.x);
          const diskResult = accretionDiskColor(
            hitR,
            hitAngle,
            uniforms.time,
            rayDir,
          );

          const remainingAlpha = float(1.0).sub(alpha);
          color.addAssign(diskResult.xyz.mul(diskResult.w).mul(remainingAlpha));
          alpha.addAssign(remainingAlpha.mul(diskResult.w));
        });
      });
    });

    // Soft horizon AA. Outer edge near photon sphere (1.5 rs) — wider ranges
    // (e.g. 1.95 rs) visually swallowed the inner disk / photon ring.
    const aaW = max(fwidth(minR).mul(2.25), rs.mul(0.025));
    const softCapture = float(1.0)
      .sub(smoothstep(rs.mul(0.9).sub(aaW), rs.mul(1.55).add(aaW), minR))
      .toVar("softCapture");
    If(captured.greaterThan(0.5), () => {
      softCapture.assign(1.0);
    });

    const skyOk = float(1.0).sub(softCapture);

    // Any non-captured ray may see the sky. (Requiring r>100 escape was flaky —
    // many miss-rays never leave the march domain in 96 steps; stars never ran.)
    If(captured.lessThan(0.5), () => {
      escaped.assign(1.0);
    });

    const starsCol = vec3(0.0, 0.0, 0.0).toVar("starsCol");
    const nebCol = vec3(0.0, 0.0, 0.0).toVar("nebCol");

    If(escaped.greaterThan(0.5).and(alpha.lessThan(0.99)), () => {
      If(uniforms.starsEnabled.greaterThan(0.5), () => {
        // Lensed rayDir flickers near the photon sphere (chaotic map).
        // Blend toward the unbent primary ray so hash cells don't strobe,
        // while still keeping most of the lensing deflection.
        const align = clamp(dot(rayDir0, rayDir), float(-1.0), float(1.0));
        const bend = float(1.0).sub(align);
        const stabilize = smoothstep(float(0.03), float(0.4), bend).mul(
          float(0.7),
        );
        const starDir = normalize(mix(rayDir, rayDir0, stabilize));
        // Dual sample + average further reduces temporal pop
        const sA = starField(starDir);
        const sB = starField(rayDir);
        starsCol.assign(mix(sB, sA, stabilize.mul(0.85).add(0.15)));
      });
      If(uniforms.nebulaEnabled.greaterThan(0.5), () => {
        nebCol.assign(nebulaField(rayDir));
      });
    });

    // Grade in *straight* (unassociated) color, then re-premultiply.
    // Gamma on premultiplied `color` washed the disk and dulled highlights.
    const diskA = alpha;
    const safeA = max(diskA, float(1.0e-4));
    const straight = color.div(safeA).toVar("straight");
    const graded = pow(max(straight, vec3(0.0)), vec3(1.0 / 2.2)).toVar(
      "graded",
    );
    const toned = mix(
      graded,
      graded.div(graded.add(vec3(0.75))),
      float(0.28),
    ).toVar("toned");

    // Photon sphere ~1.5 rs — slight boost on the critical curve
    const photonR = rs.mul(1.5);
    const distPhoton = minR.sub(photonR).abs();
    const photonAa = max(fwidth(minR).mul(2.5), rs.mul(0.05));
    const photonMask = float(1.0)
      .sub(smoothstep(float(0.0), photonAa.add(rs.mul(0.12)), distPhoton))
      .toVar("photonMask");
    toned.assign(mix(toned, toned.mul(1.18), photonMask));
    toned.assign(
      mix(
        toned,
        toned.div(toned.add(vec3(0.9))).mul(1.04),
        photonMask.mul(0.3),
      ),
    );

    // Re-premultiply disk; hole/stars only use remaining transmittance.
    const diskPm = toned.mul(diskA).toVar("diskPm");
    const remaining = float(1.0).sub(diskA);
    // Soften sky gate near the silhouette so stars fade instead of strobing
    // on/off as softCapture jitters under camera motion.
    const skyFade = pow(max(skyOk, float(0.0)), float(1.35));
    const skyW = remaining.mul(skyFade);

    const rgb = diskPm.toVar("rgb");
    const outAlpha = diskA.toVar("outAlpha");

    If(uniforms.nebulaEnabled.greaterThan(0.5), () => {
      const n = nebCol.mul(skyW);
      rgb.addAssign(n);
      const nLuma = max(n.x, max(n.y, n.z));
      outAlpha.assign(max(outAlpha, nLuma.mul(2.0).min(float(1.0))));
    });

    If(uniforms.starsEnabled.greaterThan(0.5), () => {
      // starField is very dim (brightness×tint); lift for banner visibility.
      // skyW already kills stars on the capture silhouette.
      const starsLit = pow(max(starsCol, vec3(0.0)), vec3(0.9)).mul(6.0);
      const s = starsLit.mul(skyW);
      rgb.addAssign(s);
      const sLuma = max(s.x, max(s.y, s.z));
      // Keep star pixels above Discard threshold
      outAlpha.assign(
        max(outAlpha, max(sLuma.mul(8.0), step(float(1.0e-5), sLuma).mul(0.2))),
      );
    });

    // Capture: raise opacity with pure black behind the disk (does not erase disk).
    outAlpha.assign(max(outAlpha, softCapture));

    rgb.assign(clamp(rgb, float(0.0), float(1.12)));
    outAlpha.assign(clamp(outAlpha, float(0.0), float(1.0)));

    // Empty sky → CSS bg-background (keep any lit star/disk pixel).
    const luma = max(rgb.x, max(rgb.y, rgb.z));
    Discard(outAlpha.lessThan(0.002).and(luma.lessThan(0.002)));

    return rgb.toVec4(outAlpha);
  })();
}
