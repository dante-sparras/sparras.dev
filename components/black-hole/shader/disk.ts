// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/**
 * Accretion disk — Interstellar / Gargantua inspired:
 * warm peach filaments, deep dark gaps, Keplerian streamlines (not a white plate).
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
    const innerR = uniforms.diskInnerRadius;
    const outerR = uniforms.diskOuterRadius;
    const normR = clamp(
      hitR.sub(innerR).div(max(outerR.sub(innerR), float(1.0e-3))),
      float(0.0),
      float(1.0),
    );

    // Temperature → blackbody base
    const peakTempK = uniforms.diskTemperature.mul(1000.0);
    const tempK = peakTempK.mul(
      pow(innerR.div(max(hitR, float(1.0e-3))), uniforms.temperatureFalloff),
    );
    const bb = blackbodyColor(tempK);
    const diskColor = bb.toVar("diskColor");

    // Force warm Gargantua palette (don't let mono / white tint kill it)
    // cream core → peach → dusty coral outer
    const warmPal = mix(
      vec3(1.0, 0.93, 0.88),
      mix(vec3(1.0, 0.68, 0.48), vec3(0.72, 0.42, 0.32), normR),
      smoothstep(float(0.05), float(0.9), normR),
    );
    // Blend blackbody with artistic warm (saturation-like control)
    diskColor.assign(
      mix(
        warmPal.mul(dot(bb, vec3(0.3, 0.5, 0.2)).add(0.35)),
        warmPal,
        float(0.75),
      ),
    );
    diskColor.assign(
      mix(diskColor, warmPal, uniforms.diskSaturation.mul(0.5).add(0.5)),
    );
    // Hot white-pink only in a thin inner band (not whole disk)
    const hotCore = float(1.0).sub(smoothstep(float(0.0), float(0.18), normR));
    diskColor.assign(mix(diskColor, vec3(1.05, 0.96, 0.92), hotCore.mul(0.4)));

    // Redshift near hole
    const rs = uniforms.blackHoleMass.mul(2.0);
    const rSafe = max(hitR, rs.mul(1.05));
    const gRedshift = sqrt(max(float(1.0).sub(rs.div(rSafe)), float(0.12)));
    diskColor.mulAssign(mix(float(0.5), float(1.0), gRedshift));
    diskColor.assign(
      mix(diskColor.mul(vec3(1.1, 0.65, 0.45)), diskColor, gRedshift),
    );

    // Doppler
    const rotationSign = sign(uniforms.diskRotationSpeed);
    const velocityDir = vec3(
      sin(hitAngle).negate().mul(rotationSign),
      float(0.0),
      cos(hitAngle).mul(rotationSign),
    );
    const velocityMagnitude = float(1.0).div(
      sqrt(max(hitR.div(innerR), float(0.2))),
    );
    const beta = velocityMagnitude.mul(0.3);
    const cosTheta = dot(velocityDir, rayDir);
    const dopplerFactor = float(1.0).div(float(1.0).sub(beta.mul(cosTheta)));
    const dopplerBoost = pow(
      dopplerFactor,
      float(2.2).mul(uniforms.dopplerStrength),
    );
    const dopplerClamped = clamp(dopplerBoost, float(0.5), float(1.9));
    diskColor.mulAssign(dopplerClamped);
    const dSide = clamp(
      dopplerClamped.sub(float(1.0)).mul(0.45).add(float(0.5)),
      float(0.0),
      float(1.0),
    );
    diskColor.mulAssign(
      mix(vec3(1.1, 0.78, 0.6), vec3(0.95, 0.95, 1.05), dSide),
    );

    // Edges
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
    const limb = mix(
      float(0.92),
      float(1.12),
      float(1.0).sub(abs(rayDir.y).mul(0.8).min(float(1.0))),
    );

    // ── Streamlines ────────────────────────────────────────────────────────
    const cycleLength = uniforms.turbulenceCycleTime;
    const cyclicTime = time.mod(cycleLength);
    const blendFactor = cyclicTime.div(cycleLength);

    const kepler1 = cyclicTime
      .mul(uniforms.diskRotationSpeed)
      .div(pow(max(hitR, float(0.5)), float(1.5)));
    const kepler2 = cyclicTime
      .add(cycleLength)
      .mul(uniforms.diskRotationSpeed)
      .div(pow(max(hitR, float(0.5)), float(1.5)));
    const ang1 = hitAngle.add(kepler1);
    const ang2 = hitAngle.add(kepler2);

    const stretch = max(uniforms.turbulenceStretch, float(0.1));
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
    const turbShaped = pow(turb01, uniforms.turbulenceSharpness);

    // Log spirals — dark valleys + bright lanes (reference look)
    const logR = log(max(hitR.div(innerR), float(1.0e-2)));
    const spiral = mix(
      ang2.mul(2.4).add(logR.mul(3.6)),
      ang1.mul(2.4).add(logR.mul(3.6)),
      blendFactor,
    );
    const lane = pow(abs(sin(spiral)).mul(0.5).add(0.5), float(3.2));
    const fine = pow(
      abs(sin(spiral.mul(6.0).add(turb01.mul(6.28318))))
        .mul(0.5)
        .add(0.5),
      float(8.0),
    );
    const filaments = clamp(
      lane
        .mul(0.5)
        .add(fine.mul(0.95))
        .mul(mix(float(0.4), float(1.35), turbShaped))
        .add(turbShaped.mul(0.15)),
      float(0.0),
      float(1.4),
    );

    // Deep gaps between streamlines (was ~0.86 solid → white plate)
    const ringOpacity = mix(
      float(0.06),
      float(1.0),
      pow(filaments.min(float(1.0)), float(1.15)),
    );
    // Emission only punches on filaments
    diskColor.mulAssign(
      mix(float(0.2), float(1.25), filaments.min(float(1.0))),
    );

    const innerFill = mix(
      float(1.25),
      float(0.8),
      smoothstep(float(0.0), float(0.5), normR),
    );

    const finalOpacity = clamp(
      ringOpacity.mul(edgeFalloff).mul(innerFill).mul(limb),
      float(0.0),
      float(1.0),
    );

    // Tint multiplies carefully — warm default, not pure white
    const diskTintRgb = uniforms.diskTint.xyz.mul(uniforms.diskTint.w);
    // Desaturate pure-white tints so theme foreground can't wipe peach
    const tintLum = dot(diskTintRgb, vec3(0.2126, 0.7152, 0.0722));
    const tintSafe = mix(
      diskTintRgb,
      mix(diskTintRgb, vec3(1.0, 0.88, 0.78), float(0.65)),
      smoothstep(float(0.85), float(0.98), tintLum),
    );

    const emissiveRaw = diskColor.mul(tintSafe).mul(uniforms.diskBrightness);
    // Hard soft-knee — stop white blowout
    const emissiveSoft = emissiveRaw.div(emissiveRaw.add(vec3(1.2))).mul(1.15);
    const emissiveCol = mix(emissiveRaw, emissiveSoft, float(0.72));
    const finalColor = mix(emissiveCol, tintSafe, uniforms.diskInkMode);
    const inkBoost = mix(float(1.0), float(1.35), uniforms.diskInkMode);

    return vec4(
      finalColor,
      clamp(finalOpacity.mul(inkBoost), float(0.0), float(1.0)),
    );
  });
