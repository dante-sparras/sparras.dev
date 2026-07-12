// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/**
 * Accretion disk (Interstellar / Gargantua-inspired look):
 * filamentary Keplerian streamlines, warm peach palette, Doppler + redshift.
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

    // Blackbody temperature profile
    const peakTempK = uniforms.diskTemperature.mul(1000.0);
    const tempK = peakTempK.mul(
      pow(innerR.div(max(hitR, float(1.0e-3))), uniforms.temperatureFalloff),
    );
    const diskColor = blackbodyColor(tempK).toVar("diskColor");

    // Keep some blackbody chroma, then push toward warm peach / white-hot
    const diskLum = dot(diskColor, vec3(0.2126, 0.7152, 0.0722));
    diskColor.assign(
      mix(vec3(diskLum, diskLum, diskLum), diskColor, uniforms.diskSaturation),
    );
    // Reference palette: cream core → coral/peach mid → dusty outer
    const palette = mix(
      vec3(1.0, 0.94, 0.9),
      mix(vec3(1.05, 0.72, 0.55), vec3(0.85, 0.55, 0.42), normR),
      smoothstep(float(0.0), float(0.85), normR),
    );
    diskColor.mulAssign(palette);
    // Hot inner white-pink
    diskColor.assign(
      mix(
        diskColor,
        vec3(1.05, 0.98, 0.96),
        float(1.0)
          .sub(smoothstep(float(0.0), float(0.28), normR))
          .mul(0.55),
      ),
    );

    // Gravitational redshift (dim + cool near rs)
    const rs = uniforms.blackHoleMass.mul(2.0);
    const rSafe = max(hitR, rs.mul(1.05));
    const gRedshift = sqrt(max(float(1.0).sub(rs.div(rSafe)), float(0.12)));
    diskColor.mulAssign(mix(float(0.55), float(1.0), gRedshift));
    diskColor.assign(
      mix(diskColor.mul(vec3(1.08, 0.72, 0.5)), diskColor, gRedshift),
    );

    // Doppler beaming
    const rotationSign = sign(uniforms.diskRotationSpeed);
    const velocityDir = vec3(
      sin(hitAngle).negate().mul(rotationSign),
      float(0.0),
      cos(hitAngle).mul(rotationSign),
    );
    const velocityMagnitude = float(1.0).div(
      sqrt(max(hitR.div(innerR), float(0.2))),
    );
    const beta = velocityMagnitude.mul(0.32);
    const cosTheta = dot(velocityDir, rayDir);
    const dopplerFactor = float(1.0).div(float(1.0).sub(beta.mul(cosTheta)));
    const dopplerBoost = pow(
      dopplerFactor,
      float(2.4).mul(uniforms.dopplerStrength),
    );
    const dopplerClamped = clamp(dopplerBoost, float(0.42), float(2.15));
    diskColor.mulAssign(dopplerClamped);
    // Approaching cooler-white, receding warmer peach
    const dSide = clamp(
      dopplerClamped.sub(float(1.0)).mul(0.5).add(float(0.5)),
      float(0.0),
      float(1.0),
    );
    diskColor.mulAssign(
      mix(vec3(1.12, 0.82, 0.68), vec3(0.95, 0.96, 1.05), dSide),
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

    const limb = mix(
      float(0.9),
      float(1.15),
      float(1.0).sub(abs(rayDir.y).mul(0.85).min(float(1.0))),
    );

    // ── Filamentary Keplerian streamlines (reference look) ─────────────────
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

    // Strong azimuthal stretch → long orbital streamlines
    const stretch = max(uniforms.turbulenceStretch, float(0.1));
    const noiseCoord1 = vec3(
      hitR.mul(uniforms.turbulenceScale),
      cos(ang1).div(stretch),
      sin(ang1).div(stretch),
    );
    const noiseCoord2 = vec3(
      hitR.mul(uniforms.turbulenceScale),
      cos(ang2).div(stretch),
      sin(ang2).div(stretch),
    );

    const turb1 = fbm(
      noiseCoord1,
      uniforms.turbulenceLacunarity,
      uniforms.turbulencePersistence,
    );
    const turb2 = fbm(
      noiseCoord2,
      uniforms.turbulenceLacunarity,
      uniforms.turbulencePersistence,
    );
    const turb = mix(turb2, turb1, blendFactor);
    const turb01 = clamp(turb, float(0.0), float(1.0));

    // Log-spiral arms + fine streaks (flow lines)
    const logR = log(max(hitR.div(innerR), float(1.0e-2)));
    const spiralBase1 = ang1.mul(2.2).add(logR.mul(3.4));
    const spiralBase2 = ang2.mul(2.2).add(logR.mul(3.4));
    const spiralBase = mix(spiralBase2, spiralBase1, blendFactor);

    // Broad bright lanes
    const lane = pow(abs(sin(spiralBase)).mul(0.5).add(0.5), float(2.8));
    // Fine filament striations
    const fine = pow(
      abs(sin(spiralBase.mul(5.5).add(turb01.mul(6.28318))))
        .mul(0.5)
        .add(0.5),
      float(6.5),
    );
    // FBM modulates which lanes light up
    const turbShaped = pow(turb01, uniforms.turbulenceSharpness);
    const filaments = clamp(
      lane
        .mul(0.55)
        .add(fine.mul(0.85))
        .mul(mix(float(0.55), float(1.25), turbShaped))
        .add(turbShaped.mul(0.2)),
      float(0.0),
      float(1.5),
    );

    // Structure-heavy opacity: dark gaps + bright streamlines (not a solid plate)
    const ringOpacity = mix(
      float(0.12),
      float(1.0),
      filaments.mul(0.75).min(float(1.0)),
    );

    // Brighter emission on dense filaments (streaks of light)
    diskColor.mulAssign(
      mix(float(0.35), float(1.45), filaments.min(float(1.0))),
    );

    // Denser / hotter near the void
    const innerFill = mix(
      float(1.35),
      float(0.85),
      smoothstep(float(0.0), float(0.55), normR),
    );

    const finalOpacity = clamp(
      ringOpacity.mul(edgeFalloff).mul(innerFill).mul(limb),
      float(0.0),
      float(1.0),
    );

    const diskTintRgb = uniforms.diskTint.xyz.mul(uniforms.diskTint.w);
    const emissiveRaw = diskColor.mul(diskTintRgb).mul(uniforms.diskBrightness);
    const emissiveSoft = emissiveRaw.div(emissiveRaw.add(vec3(0.85))).mul(1.4);
    const emissiveCol = mix(emissiveRaw, emissiveSoft, float(0.45));
    const inkCol = diskTintRgb;
    const finalColor = mix(emissiveCol, inkCol, uniforms.diskInkMode);
    const inkBoost = mix(float(1.0), float(1.45), uniforms.diskInkMode);

    return vec4(
      finalColor,
      clamp(finalOpacity.mul(inkBoost), float(0.0), float(1.0)),
    );
  });
