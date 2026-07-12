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

    // Soft horizon AA — silhouette is nearly circular (Schwarzschild shadow).
    // Keep the outer edge near ~1.35 rs (not 1.55) so soft capture doesn't
    // swallow the lower secondary ring into a second bent void.
    const aaW = max(fwidth(minR).mul(2.0), rs.mul(0.02));
    const softCapture = float(1.0)
      .sub(smoothstep(rs.mul(0.9).sub(aaW), rs.mul(1.35).add(aaW), minR))
      .toVar("softCapture");
    If(captured.greaterThan(0.5), () => {
      softCapture.assign(1.0);
    });

    // ── Lensed secondary disk (bright ring only — never a second dark hole) ─
    // Higher-order images live in a thin annulus around the photon sphere.
    // Gate hard by softCapture so nothing paints *into* the event-horizon void
    // (that was bending the lower silhouette from elevated views).
    const photonR = rs.mul(1.5);
    const distPhoton = minR.sub(photonR).abs();
    // Thin annulus around photon sphere; zero inside the shadow
    const ringAnnulus = float(1.0)
      .sub(smoothstep(float(0.0), rs.mul(0.28), distPhoton))
      .toVar("ringAnnulus");
    const outsideShadow = float(1.0)
      .sub(smoothstep(float(0.15), float(0.55), softCapture))
      .toVar("outsideShadow");
    const secondaryBand = ringAnnulus.mul(outsideShadow).toVar("secondaryBand");

    // Accumulate secondary as *emission only* into a separate buffer so we
    // never create an opaque dark blob under the hole.
    const secEmit = vec3(0.0, 0.0, 0.0).toVar("secEmit");
    const secAlpha = float(0.0).toVar("secAlpha");

    If(secondaryBand.greaterThan(0.05).and(alpha.lessThan(0.97)), () => {
      const secR = mix(
        innerR.mul(1.05),
        outerR.mul(0.55),
        clamp(minR.sub(rs.mul(1.2)).div(rs.mul(1.2)), float(0.0), float(1.0)),
      );
      // World-space azimuth from bent ray (not screen-space — angle-stable)
      const a0 = atan(rayDir.z, rayDir.x);
      const a1 = a0.add(float(Math.PI));
      const secA = accretionDiskColor(secR, a0, uniforms.time, rayDir);
      const secB = accretionDiskColor(secR, a1, uniforms.time, rayDir);
      const secMix = mix(secA, secB, float(0.5));

      // Emission weight: bright filaments, little solid opacity
      const w = secondaryBand.mul(float(0.85)).mul(float(1.0).sub(alpha));
      secEmit.addAssign(secMix.xyz.mul(secMix.w).mul(w).mul(1.35));
      secAlpha.addAssign(secMix.w.mul(w).mul(float(0.35)));

      // Far-side lower wrap — still emission-only, weaker
      const secLow = accretionDiskColor(
        mix(innerR.mul(1.1), outerR.mul(0.45), float(0.35)),
        a0.add(float(1.15)),
        uniforms.time,
        rayDir,
      );
      const lowW = secondaryBand.mul(float(0.4)).mul(float(1.0).sub(alpha));
      secEmit.addAssign(secLow.xyz.mul(secLow.w).mul(lowW));
      secAlpha.addAssign(secLow.w.mul(lowW).mul(float(0.25)));
    });

    // Merge secondary emission into march buffer (behind primary only)
    {
      const rem = float(1.0).sub(alpha);
      color.addAssign(secEmit.mul(rem));
      alpha.addAssign(rem.mul(secAlpha).min(float(0.45)));
    }

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
    // Sky/stars fully killed inside the shadow (keeps void pure)
    const skyFade = pow(max(skyOk, float(0.0)), float(1.6));
    const skyW = remaining.mul(skyFade);

    // Disk in front of the hole only — never let secondary/glow fill the void
    const rgb = diskPm.toVar("rgb");
    const outAlpha = diskA.toVar("outAlpha");

    // Soft edge glow only outside deep capture
    const diskEnergy = max(diskPm.x, max(diskPm.y, diskPm.z));
    const edgeGlow = fwidth(diskEnergy)
      .mul(1.8)
      .min(float(0.28))
      .mul(float(1.0).sub(softCapture.mul(0.85)));
    rgb.addAssign(diskPm.mul(edgeGlow.mul(0.9)));
    outAlpha.assign(max(outAlpha, edgeGlow.mul(0.25)));

    // Einstein-ring fill — thin bright rim outside the void
    const ringCol = vec3(1.0, 0.94, 0.88);
    const ring = photonMask.mul(float(0.55)).mul(skyOk.add(diskA.mul(0.35)));
    rgb.addAssign(ringCol.mul(ring));
    const caustic = photonMask.mul(photonMask).mul(float(0.18)).mul(skyOk);
    rgb.addAssign(ringCol.mul(caustic));
    outAlpha.assign(max(outAlpha, photonMask.mul(skyOk).mul(0.65)));

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

    // Capture: pure black *behind* the disk. Wipe any residual light that
    // leaked into the shadow so the silhouette stays a clean circle from
    // every viewing angle (no bent lower void).
    const holeBehind = softCapture.mul(float(1.0).sub(diskA));
    // Where the hole is empty of disk, force pure black (premultiplied 0, a=1)
    rgb.assign(mix(rgb, vec3(0.0, 0.0, 0.0), holeBehind));
    outAlpha.assign(max(outAlpha, softCapture));

    rgb.assign(clamp(rgb, float(0.0), float(1.05)));
    outAlpha.assign(clamp(outAlpha, float(0.0), float(1.0)));

    const luma = max(rgb.x, max(rgb.y, rgb.z));
    Discard(outAlpha.lessThan(0.002).and(luma.lessThan(0.002)));

    return rgb.toVec4(outAlpha);
  })();
}
