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
  abs,
  exp,
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

    // Adaptive steps: fine near hole + inside the volumetric disk slab
    Loop(120, () => {
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

      // Cylindrical radius for disk slab
      const cylR = sqrt(rayPos.x.mul(rayPos.x).add(rayPos.z.mul(rayPos.z)));
      const normR = clamp(
        cylR.sub(innerR).div(max(outerR.sub(innerR), float(1.0e-3))),
        float(0.0),
        float(1.0),
      );
      // Thin at the hole (void stays mostly black); thicker outer wings for the
      // Interstellar “dome” / side structure when lensed or slightly tilted.
      // Outer flare keeps the long horizontal arms readable.
      const scaleH = uniforms.diskScaleHeight.mul(
        mix(float(0.22), float(2.15), pow(normR, float(0.65))),
      );
      const absY = abs(rayPos.y);
      // Soft radial gate (0–1 floats — no boolean .toFloat())
      const radialGate = smoothstep(
        innerR.mul(0.94),
        innerR.mul(1.0),
        cylR,
      ).mul(smoothstep(outerR.mul(1.06), outerR.mul(1.0), cylR));
      const nearDisk = radialGate.mul(
        float(1.0).sub(smoothstep(float(0.0), scaleH.mul(3.0), absY)),
      );

      const nearHole = float(1.0).sub(
        smoothstep(rs.mul(1.05), rs.mul(14.0), r),
      );
      // Smaller steps near hole and inside the volume for smooth thickness
      const dt = uniforms.stepSize
        .mul(mix(float(1.0), float(0.1), nearHole))
        .mul(mix(float(1.0), float(0.32), nearDisk))
        .toVar("dt");

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

      // ── Volumetric disk: Gaussian vertical density × Beer–Lambert ──────────
      // Sample mid-step for less banding; color from full disk model (Doppler etc.)
      If(alpha.lessThan(0.99), () => {
        const mid = mix(prevPos, rayPos, float(0.5));
        const mR = sqrt(mid.x.mul(mid.x).add(mid.z.mul(mid.z)));
        const mNorm = clamp(
          mR.sub(innerR).div(max(outerR.sub(innerR), float(1.0e-3))),
          float(0.0),
          float(1.0),
        );
        const mH = uniforms.diskScaleHeight.mul(
          mix(float(0.22), float(2.15), pow(mNorm, float(0.65))),
        );
        const mAbsY = abs(mid.y);
        // Sharp near the hole, soft enough outer for volume wings
        const yOverH = mAbsY.div(max(mH, float(1.0e-4)));
        const sharp = mix(float(2.6), float(1.35), mNorm);
        const vert = exp(yOverH.mul(yOverH).mul(sharp).negate());
        const inVol = mR
          .greaterThan(innerR)
          .and(mR.lessThan(outerR))
          .and(vert.greaterThan(0.015));

        If(inVol, () => {
          const hitAngle = atan(mid.z, mid.x);
          const diskResult = accretionDiskColor(
            mR,
            hitAngle,
            uniforms.time,
            rayDir,
          );

          const dens = vert.mul(diskResult.w).mul(float(2.55));
          const optical = dens.mul(dt);
          const stepA = float(1.0).sub(exp(optical.negate())).min(float(1.0));

          const remainingAlpha = float(1.0).sub(alpha);
          color.addAssign(diskResult.xyz.mul(stepA).mul(remainingAlpha));
          alpha.addAssign(remainingAlpha.mul(stepA));
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

    // ── Lensed secondary disk images (upper dome + lower ring) ─────────────
    // Primary march alone reads as a thin equator. Interstellar’s wrap is
    // higher-order light: sample the disk again near the critical curve.
    const photonR = rs.mul(1.5);
    const distPhoton = minR.sub(photonR).abs();
    const secondaryBand = float(1.0)
      .sub(smoothstep(float(0.0), rs.mul(0.55), distPhoton))
      .mul(float(1.0).sub(softCapture.mul(0.85)))
      .toVar("secondaryBand");

    If(secondaryBand.greaterThan(0.04).and(alpha.lessThan(0.97)), () => {
      // Map closest approach → disk radius (inner bright secondary)
      const secR = mix(
        innerR.mul(1.05),
        outerR.mul(0.62),
        clamp(minR.sub(rs.mul(1.15)).div(rs.mul(1.4)), float(0.0), float(1.0)),
      );
      // Two opposite azimuths = near-side + far-side contribution
      const a0 = atan(rayDir.z, rayDir.x);
      const a1 = a0.add(float(Math.PI));
      const secA = accretionDiskColor(secR, a0, uniforms.time, rayDir);
      const secB = accretionDiskColor(secR, a1, uniforms.time, rayDir);
      // Bias lower screen half slightly (classic secondary ring below)
      const lowerBias = smoothstep(float(0.15), float(-0.55), screenPos.y)
        .mul(float(0.35))
        .add(float(0.65));
      const upperBias = smoothstep(float(-0.1), float(0.65), screenPos.y)
        .mul(float(0.4))
        .add(float(0.55));
      // Mix opposites; weight by lobe
      const secMix = mix(secA, secB, float(0.5));
      const lobeW = mix(lowerBias, upperBias, float(0.5)).mul(secondaryBand);
      const rem = float(1.0).sub(alpha);
      const w = lobeW.mul(float(0.72)).mul(rem);
      color.addAssign(secMix.xyz.mul(secMix.w).mul(w));
      alpha.addAssign(rem.mul(secMix.w).mul(lobeW).mul(float(0.55)));

      // Extra lower-ring pass (far side of disk under the hole)
      const secR2 = mix(innerR.mul(1.15), outerR.mul(0.48), float(0.4));
      const secLow = accretionDiskColor(
        secR2,
        a0.add(float(1.2)),
        uniforms.time,
        rayDir,
      );
      const lowW = lowerBias
        .mul(secondaryBand)
        .mul(float(0.5))
        .mul(float(1.0).sub(alpha));
      color.addAssign(secLow.xyz.mul(secLow.w).mul(lowW));
      alpha.addAssign(float(1.0).sub(alpha).mul(secLow.w).mul(lowW).mul(0.8));
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

    // Grade in straight color, then re-premultiply — hard knee kills white plate
    const diskA = alpha;
    const safeA = max(diskA, float(1.0e-4));
    const straight = color.div(safeA).toVar("straight");
    // Mild gamma; keep warm midtones
    const graded = pow(max(straight, vec3(0.0)), vec3(0.9)).toVar("graded");
    const toned = graded
      .div(graded.add(vec3(1.1)))
      .mul(1.25)
      .toVar("toned");

    // Photon sphere / Einstein ring — thin bright rim
    const photonAa = max(fwidth(minR).mul(2.0), rs.mul(0.022));
    const photonMask = float(1.0)
      .sub(smoothstep(float(0.0), photonAa.add(rs.mul(0.04)), distPhoton))
      .toVar("photonMask");
    toned.assign(mix(toned, toned.mul(1.2), photonMask.mul(0.7)));

    const diskPm = toned.mul(diskA).toVar("diskPm");
    const remaining = float(1.0).sub(diskA);
    const skyFade = pow(max(skyOk, float(0.0)), float(1.35));
    const skyW = remaining.mul(skyFade);

    const rgb = diskPm.toVar("rgb");
    const outAlpha = diskA.toVar("outAlpha");

    // Soft edge glow only (no plate fill that turned the disk into a white bar)
    const diskEnergy = max(diskPm.x, max(diskPm.y, diskPm.z));
    const edgeGlow = fwidth(diskEnergy).mul(1.8).min(float(0.28));
    rgb.addAssign(diskPm.mul(edgeGlow.mul(0.9)));
    outAlpha.assign(max(outAlpha, edgeGlow.mul(0.25)));

    // Einstein-ring fill — warm white, not pure blown-out
    const ringCol = vec3(1.0, 0.94, 0.88);
    const ring = photonMask.mul(float(0.55)).mul(skyOk.add(diskA.mul(0.4)));
    rgb.addAssign(ringCol.mul(ring));
    const caustic = photonMask.mul(photonMask).mul(float(0.2));
    rgb.addAssign(ringCol.mul(caustic));
    outAlpha.assign(max(outAlpha, photonMask.mul(0.65)));

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

    rgb.assign(clamp(rgb, float(0.0), float(1.05)));
    outAlpha.assign(clamp(outAlpha, float(0.0), float(1.0)));

    const luma = max(rgb.x, max(rgb.y, rgb.z));
    Discard(outAlpha.lessThan(0.002).and(luma.lessThan(0.002)));

    return rgb.toVec4(outAlpha);
  })();
}
