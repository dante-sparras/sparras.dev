// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/** Accretion disk: blackbody, Doppler, turbulence, ink/emissive modes. */

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
  dot,
  mix,
  smoothstep,
} from "three/tsl";
import { fbm } from "./noise";
import { blackbodyColor } from "./blackbody";

// Accretion disk color with blackbody temperature, Doppler beaming, and turbulence
export const createAccretionDiskColor = (uniforms: BlackHoleUniforms) =>
  Fn(([hitR, hitAngle, time, rayDir]) => {
    const innerR = uniforms.diskInnerRadius;
    const outerR = uniforms.diskOuterRadius;
    const normR = clamp(
      hitR.sub(innerR).div(outerR.sub(innerR)),
      float(0.0),
      float(1.0),
    );

    // Temperature profile: T(r) = T_peak × (r_inner / r)^α
    // Inner disk is hotter (more gravitational energy released)
    // Standard thin disk model uses α ≈ 0.75
    const peakTempK = uniforms.diskTemperature.mul(1000.0);
    const tempK = peakTempK.mul(
      pow(innerR.div(hitR), uniforms.temperatureFalloff),
    );
    const diskColor = blackbodyColor(tempK).toVar("diskColor");

    // Site-tuned: blend blackbody toward luminance for monochrome UI harmony
    const diskLum = dot(diskColor, vec3(0.2126, 0.7152, 0.0722)).toVar(
      "diskLum",
    );
    const monoDisk = vec3(diskLum, diskLum, diskLum);
    diskColor.assign(mix(monoDisk, diskColor, uniforms.diskSaturation));

    // Mild warm shift on the inner disk (hotter gas), keeps outer cooler tone
    const warmInner = mix(
      vec3(1.0, 0.92, 0.86),
      vec3(1.0, 1.0, 1.0),
      smoothstep(float(0.0), float(0.55), normR),
    );
    diskColor.mulAssign(warmInner);

    // Doppler beaming: D = 1/(1 - β·cos(θ)), brightness ∝ D³
    const rotationSign = sign(uniforms.diskRotationSpeed);
    const velocityDir = vec3(
      sin(hitAngle).negate().mul(rotationSign),
      float(0.0),
      cos(hitAngle).mul(rotationSign),
    );
    const velocityMagnitude = float(1.0).div(sqrt(hitR.div(innerR)));
    const beta = velocityMagnitude.mul(0.3);
    const cosTheta = dot(velocityDir, rayDir);
    const dopplerFactor = float(1.0).div(float(1.0).sub(beta.mul(cosTheta)));
    const dopplerBoost = pow(
      dopplerFactor,
      float(2.2).mul(uniforms.dopplerStrength),
    );
    // Narrower range → less harsh bright/dark split around the disk
    diskColor.mulAssign(clamp(dopplerBoost, float(0.55), float(1.85)));

    // Edge falloff
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

    // Turbulent ring pattern with cyclic time to prevent winding artifacts
    const ringOpacity = float(1.0).toVar("ringOpacity");
    const cycleLength = uniforms.turbulenceCycleTime;
    const cyclicTime = time.mod(cycleLength);
    const blendFactor = cyclicTime.div(cycleLength);

    // Keplerian rotation: inner regions rotate faster (ω ∝ r^-1.5)
    const keplerianPhase1 = cyclicTime
      .mul(uniforms.diskRotationSpeed)
      .div(pow(hitR, float(1.5)));
    const keplerianPhase2 = cyclicTime
      .add(cycleLength)
      .mul(uniforms.diskRotationSpeed)
      .div(pow(hitR, float(1.5)));
    const rotatedAngle1 = hitAngle.add(keplerianPhase1);
    const rotatedAngle2 = hitAngle.add(keplerianPhase2);

    // Anisotropic noise sampling: radial creates rings, azimuthal creates arcs
    const noiseCoord1 = vec3(
      hitR.mul(uniforms.turbulenceScale),
      cos(rotatedAngle1).div(uniforms.turbulenceStretch.max(0.1)),
      sin(rotatedAngle1).div(uniforms.turbulenceStretch.max(0.1)),
    );
    const noiseCoord2 = vec3(
      hitR.mul(uniforms.turbulenceScale),
      cos(rotatedAngle2).div(uniforms.turbulenceStretch.max(0.1)),
      sin(rotatedAngle2).div(uniforms.turbulenceStretch.max(0.1)),
    );

    const turbulence1 = fbm(
      noiseCoord1,
      uniforms.turbulenceLacunarity,
      uniforms.turbulencePersistence,
    );
    const turbulence2 = fbm(
      noiseCoord2,
      uniforms.turbulenceLacunarity,
      uniforms.turbulencePersistence,
    );
    const turbulence = mix(turbulence2, turbulence1, blendFactor);
    // Soft structure on a high floor — disk should read solid / filled, not sparse
    const turb01 = clamp(turbulence, float(0.0), float(1.0));
    const turbShaped = pow(turb01, uniforms.turbulenceSharpness);
    // High base (~0.86) + light modulation so wisps sit on a filled ring
    ringOpacity.assign(mix(float(0.86), float(1.0), turbShaped.mul(0.5)));

    // Denser near the void (inner edge); slightly airier only at outer rim
    const innerFill = mix(
      float(1.2),
      float(0.95),
      smoothstep(float(0.0), float(0.65), normR),
    );
    const finalOpacity = clamp(
      ringOpacity.mul(edgeFalloff).mul(innerFill),
      float(0.0),
      float(1.0),
    );

    // Emissive (dark UI) vs ink stamp (light UI)
    // ink: solid dark tint; structure comes from opacity only
    const diskTintRgb = uniforms.diskTint.xyz.mul(uniforms.diskTint.w);
    // Mild soft-knee: keep punch, avoid pure white blowout
    const emissiveRaw = diskColor.mul(diskTintRgb).mul(uniforms.diskBrightness);
    const emissiveSoft = emissiveRaw.div(emissiveRaw.add(vec3(1.0))).mul(1.35);
    const emissiveCol = mix(emissiveRaw, emissiveSoft, float(0.55));
    const inkCol = diskTintRgb;
    const finalColor = mix(emissiveCol, inkCol, uniforms.diskInkMode);
    const inkBoost = mix(float(1.0), float(1.45), uniforms.diskInkMode);
    return vec4(
      finalColor,
      clamp(finalOpacity.mul(inkBoost), float(0.0), float(1.0)),
    );
  });
