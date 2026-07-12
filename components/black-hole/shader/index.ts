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
  dot,
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
    const minR = float(1.0e6).toVar("minR");

    const innerR = uniforms.diskInnerRadius;
    const outerR = uniforms.diskOuterRadius;

    // Adaptive steps: fine near hole for clean photon ring / thin disk crossings
    Loop(112, () => {
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

      // Hard capture slightly inside horizon
      If(r.lessThan(rs.mul(0.9)), () => {
        captured.assign(1.0);
        Break();
      });

      If(r.greaterThan(100.0), () => {
        escaped.assign(1.0);
        Break();
      });

      const nearHole = float(1.0).sub(
        smoothstep(rs.mul(1.05), rs.mul(14.0), r),
      );
      const dt = uniforms.stepSize.mul(mix(float(1.0), float(0.1), nearHole));

      // Guarded deflection (avoid /0 at origin)
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

    // Soft horizon AA — outer edge near photon sphere
    const aaW = max(fwidth(minR).mul(2.25), rs.mul(0.025));
    const softCapture = float(1.0)
      .sub(smoothstep(rs.mul(0.9).sub(aaW), rs.mul(1.55).add(aaW), minR))
      .toVar("softCapture");
    If(captured.greaterThan(0.5), () => {
      softCapture.assign(1.0);
    });

    const skyOk = float(1.0).sub(softCapture);

    If(captured.lessThan(0.5), () => {
      escaped.assign(1.0);
    });

    const starsCol = vec3(0.0, 0.0, 0.0).toVar("starsCol");
    const nebCol = vec3(0.0, 0.0, 0.0).toVar("nebCol");

    If(escaped.greaterThan(0.5).and(alpha.lessThan(0.99)), () => {
      If(uniforms.starsEnabled.greaterThan(0.5), () => {
        const align = clamp(dot(rayDir0, rayDir), float(-1.0), float(1.0));
        const bend = float(1.0).sub(align);
        const stabilize = smoothstep(float(0.03), float(0.4), bend).mul(
          float(0.7),
        );
        const starDir = normalize(mix(rayDir, rayDir0, stabilize));
        const sA = starField(starDir);
        const sB = starField(rayDir);
        starsCol.assign(mix(sB, sA, stabilize.mul(0.85).add(0.15)));
      });
      If(uniforms.nebulaEnabled.greaterThan(0.5), () => {
        nebCol.assign(nebulaField(rayDir));
      });
    });

    // Grade in straight color, then re-premultiply
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

    // Photon sphere / Einstein ring
    const photonR = rs.mul(1.5);
    const distPhoton = minR.sub(photonR).abs();
    const photonAa = max(fwidth(minR).mul(2.8), rs.mul(0.04));
    const photonMask = float(1.0)
      .sub(smoothstep(float(0.0), photonAa.add(rs.mul(0.1)), distPhoton))
      .toVar("photonMask");
    // Boost disk on the critical curve
    toned.assign(mix(toned, toned.mul(1.22), photonMask));
    toned.assign(
      mix(
        toned,
        toned.div(toned.add(vec3(0.85))).mul(1.06),
        photonMask.mul(0.28),
      ),
    );

    const diskPm = toned.mul(diskA).toVar("diskPm");
    const remaining = float(1.0).sub(diskA);
    const skyFade = pow(max(skyOk, float(0.0)), float(1.35));
    const skyW = remaining.mul(skyFade);

    const rgb = diskPm.toVar("rgb");
    const outAlpha = diskA.toVar("outAlpha");

    // Cheap in-shader glow (no post bloom): edge bleed from disk energy
    const diskEnergy = max(diskPm.x, max(diskPm.y, diskPm.z));
    const edgeGlow = fwidth(diskEnergy).mul(3.2).min(float(0.55));
    rgb.addAssign(diskPm.mul(edgeGlow.mul(1.6)));
    // Soft plate under bright disk (read as heat haze, not a second ring)
    rgb.addAssign(diskPm.mul(float(0.12)));
    outAlpha.assign(max(outAlpha, edgeGlow.mul(0.35)));

    // Einstein-ring fill light (visible even with thin disk alpha)
    const ringCol = vec3(1.0, 0.96, 0.9);
    const ring = photonMask.mul(float(0.42)).mul(skyOk.add(diskA.mul(0.35)));
    rgb.addAssign(ringCol.mul(ring));
    outAlpha.assign(max(outAlpha, photonMask.mul(0.55)));

    If(uniforms.nebulaEnabled.greaterThan(0.5), () => {
      const n = nebCol.mul(skyW);
      rgb.addAssign(n);
      const nLuma = max(n.x, max(n.y, n.z));
      outAlpha.assign(max(outAlpha, nLuma.mul(2.0).min(float(1.0))));
    });

    If(uniforms.starsEnabled.greaterThan(0.5), () => {
      const starsLit = pow(max(starsCol, vec3(0.0)), vec3(0.9)).mul(6.0);
      const s = starsLit.mul(skyW);
      rgb.addAssign(s);
      const sLuma = max(s.x, max(s.y, s.z));
      outAlpha.assign(
        max(outAlpha, max(sLuma.mul(8.0), step(float(1.0e-5), sLuma).mul(0.2))),
      );
    });

    // Capture: pure black behind the disk
    outAlpha.assign(max(outAlpha, softCapture));

    rgb.assign(clamp(rgb, float(0.0), float(1.2)));
    outAlpha.assign(clamp(outAlpha, float(0.0), float(1.0)));

    const luma = max(rgb.x, max(rgb.y, rgb.z));
    Discard(outAlpha.lessThan(0.002).and(luma.lessThan(0.002)));

    return rgb.toVec4(outAlpha);
  })();
}
