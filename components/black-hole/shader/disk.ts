// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/**
 * Accretion disk: blackbody T(r), GR redshift, Keplerian Doppler, FBM streamlines.
 *
 * T(r) = T_peak × (r_in / r)^α  (standard thin-disk style)
 * g ≈ √(1 − rs/r) for static observers on the equator
 * β_φ ≈ √(M/r) (circular Keplerian, geometric units)
 * D ≈ 1 / (1 − β cos θ)  with boost D^{2+ε}
 */
import type { BlackHoleUniforms } from "../mesh";
import {
  vec3,
  vec4,
  float,
  Fn,
  clamp,
  pow,
  sqrt,
  sign,
  sin,
  cos,
  abs,
  max,
  log,
  dot,
  mix,
  smoothstep,
} from "three/tsl";
import { fbm } from "./noise";
import { blackbodyColor } from "./blackbody";

export const createAccretionDiskColor = (uniforms: BlackHoleUniforms) =>
  Fn(([hitR, hitAngle, time, rayDir]) => {
    const M = uniforms.blackHoleMass;
    const rs = M.mul(2.0);
    const innerR = uniforms.diskInnerRadius;
    const outerR = uniforms.diskOuterRadius;
    const normR = clamp(
      hitR.sub(innerR).div(max(outerR.sub(innerR), float(1.0e-3))),
      float(0.0),
      float(1.0),
    );

    // Temperature profile
    const peakTempK = uniforms.diskTemperature.mul(1000.0);
    const tempK = peakTempK.mul(
      pow(innerR.div(max(hitR, float(1.0e-3))), uniforms.temperatureFalloff),
    );
    const bb = blackbodyColor(tempK);
    const diskColor = bb.toVar("diskColor");

    // Site palette: keep blackbody, push warm for UI (saturation blends toward mono)
    const lum = dot(diskColor, vec3(0.2126, 0.7152, 0.0722));
    const mono = vec3(lum, lum, lum);
    diskColor.assign(mix(mono, diskColor, uniforms.diskSaturation));
    // Mild warm grade (doesn't wipe blackbody structure)
    const warm = mix(
      vec3(1.0, 0.94, 0.9),
      mix(vec3(1.02, 0.78, 0.58), vec3(0.88, 0.55, 0.42), normR),
      smoothstep(float(0.0), float(0.85), normR),
    );
    diskColor.mulAssign(warm);

    // Gravitational redshift g = √(1 − rs/r) (static equatorial observer)
    const rSafe = max(hitR, rs.mul(1.05));
    const gRedshift = sqrt(max(float(1.0).sub(rs.div(rSafe)), float(0.08)));
    diskColor.mulAssign(mix(float(0.45), float(1.0), gRedshift));
    diskColor.assign(
      mix(diskColor.mul(vec3(1.12, 0.62, 0.42)), diskColor, gRedshift),
    );

    // Keplerian orbital velocity β ≈ √(M/r) (c = 1), capped for stability
    const rotationSign = sign(uniforms.diskRotationSpeed);
    const velocityDir = vec3(
      sin(hitAngle).negate().mul(rotationSign),
      float(0.0),
      cos(hitAngle).mul(rotationSign),
    );
    const betaKep = sqrt(M.div(max(hitR, M.mul(3.0)))).min(float(0.55));
    const cosTheta = dot(velocityDir, rayDir);
    // Beaming: D = 1/(1 − β·n̂); intensity ∝ D^{3} classic, we use 2.2×strength
    const dopplerFactor = float(1.0).div(
      max(float(1.0).sub(betaKep.mul(cosTheta)), float(0.15)),
    );
    const dopplerBoost = pow(
      dopplerFactor,
      float(2.2).mul(uniforms.dopplerStrength),
    );
    const dopplerClamped = clamp(dopplerBoost, float(0.4), float(2.2));
    diskColor.mulAssign(dopplerClamped);
    // Subtle cool/warm chroma by side
    const dSide = clamp(
      dopplerClamped.sub(float(1.0)).mul(0.4).add(float(0.5)),
      float(0.0),
      float(1.0),
    );
    diskColor.mulAssign(
      mix(vec3(1.08, 0.8, 0.65), vec3(0.94, 0.96, 1.06), dSide),
    );

    // Radial edges
    const edgeFalloff = smoothstep(
      float(0.0),
      uniforms.diskEdgeSoftnessInner,
      normR,
    ).mul(
      smoothstep(
        float(1.0),
        float(1.0).sub(uniforms.diskEdgeSoftnessOuter),
        normR,
      ),
    );
    // Limb density when viewing edge-on
    const limb = mix(
      float(0.9),
      float(1.12),
      float(1.0).sub(abs(rayDir.y).mul(0.85).min(float(1.0))),
    );

    // Keplerian-sheared FBM streamlines
    const cycleLength = max(uniforms.turbulenceCycleTime, float(0.5));
    const cyclicTime = time.mod(cycleLength);
    const blendFactor = cyclicTime.div(cycleLength);

    const omega1 = cyclicTime
      .mul(uniforms.diskRotationSpeed)
      .div(pow(max(hitR, float(0.5)), float(1.5)));
    const omega2 = cyclicTime
      .add(cycleLength)
      .mul(uniforms.diskRotationSpeed)
      .div(pow(max(hitR, float(0.5)), float(1.5)));
    const ang1 = hitAngle.add(omega1);
    const ang2 = hitAngle.add(omega2);

    // stretch ≤ 0 would explode; floor at 0.15
    const stretch = max(uniforms.turbulenceStretch, float(0.15));
    const nc1 = vec3(
      hitR.mul(uniforms.turbulenceScale),
      cos(ang1).div(stretch),
      sin(ang1).div(stretch),
    );
    const nc2 = vec3(
      hitR.mul(uniforms.turbulenceScale),
      cos(ang2).div(stretch),
      sin(ang2).div(stretch),
    );
    const turb = mix(
      fbm(nc2, uniforms.turbulenceLacunarity, uniforms.turbulencePersistence),
      fbm(nc1, uniforms.turbulenceLacunarity, uniforms.turbulencePersistence),
      blendFactor,
    );
    const turb01 = clamp(turb, float(0.0), float(1.0));
    const turbShaped = pow(
      turb01,
      max(uniforms.turbulenceSharpness, float(0.2)),
    );

    // Log-spiral lanes + fine striations
    const logR = log(max(hitR.div(max(innerR, float(0.1))), float(1.0e-2)));
    const spiral = mix(
      ang2.mul(2.3).add(logR.mul(3.4)),
      ang1.mul(2.3).add(logR.mul(3.4)),
      blendFactor,
    );
    const lane = pow(abs(sin(spiral)).mul(0.5).add(0.5), float(3.0));
    const fine = pow(
      abs(sin(spiral.mul(5.5).add(turb01.mul(6.28318))))
        .mul(0.5)
        .add(0.5),
      float(7.0),
    );
    const filaments = clamp(
      lane
        .mul(0.48)
        .add(fine.mul(0.9))
        .mul(mix(float(0.45), float(1.3), turbShaped))
        .add(turbShaped.mul(0.18)),
      float(0.0),
      float(1.4),
    );

    const ringOpacity = mix(
      float(0.08),
      float(1.0),
      pow(filaments.min(float(1.0)), float(1.1)),
    );
    diskColor.mulAssign(
      mix(float(0.25), float(1.22), filaments.min(float(1.0))),
    );

    const innerFill = mix(
      float(1.2),
      float(0.82),
      smoothstep(float(0.0), float(0.5), normR),
    );
    const finalOpacity = clamp(
      ringOpacity.mul(edgeFalloff).mul(innerFill).mul(limb),
      float(0.0),
      float(1.0),
    );

    const diskTintRgb = uniforms.diskTint.xyz.mul(uniforms.diskTint.w);
    // Guard pure-white theme tints
    const tintLum = dot(diskTintRgb, vec3(0.2126, 0.7152, 0.0722));
    const tintSafe = mix(
      diskTintRgb,
      mix(diskTintRgb, vec3(1.0, 0.88, 0.78), float(0.6)),
      smoothstep(float(0.88), float(0.99), tintLum),
    );

    const emissiveRaw = diskColor.mul(tintSafe).mul(uniforms.diskBrightness);
    const emissiveSoft = emissiveRaw.div(emissiveRaw.add(vec3(1.15))).mul(1.12);
    const emissiveCol = mix(emissiveRaw, emissiveSoft, float(0.7));
    const finalColor = mix(emissiveCol, tintSafe, uniforms.diskInkMode);
    const inkBoost = mix(float(1.0), float(1.35), uniforms.diskInkMode);

    return vec4(
      finalColor,
      clamp(finalOpacity.mul(inkBoost), float(0.0), float(1.0)),
    );
  });
