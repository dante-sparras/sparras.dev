// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/**
 * Accretion disk (physics-first):
 *   T(r) = T_peak (r_in/r)^α
 *   g = √(1 − rs/r)  (static equatorial redshift)
 *   β = √(M/r)       (Keplerian, geometric units)
 *   D = 1/(1 − β cos θ), I ∝ D^{2.2 s}
 *   Structure = Keplerian-sheared FBM only (no painted log-spirals)
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

    // Blackbody temperature
    const peakTempK = uniforms.diskTemperature.mul(1000.0);
    const tempK = peakTempK.mul(
      pow(innerR.div(max(hitR, float(1.0e-3))), uniforms.temperatureFalloff),
    );
    const diskColor = blackbodyColor(tempK).toVar("diskColor");

    // Saturation → luminance blend (site monochrome option)
    const lum = dot(diskColor, vec3(0.2126, 0.7152, 0.0722));
    diskColor.assign(
      mix(vec3(lum, lum, lum), diskColor, uniforms.diskSaturation),
    );

    // Gravitational redshift
    const rSafe = max(hitR, rs.mul(1.02));
    const g = sqrt(max(float(1.0).sub(rs.div(rSafe)), float(0.05)));
    diskColor.mulAssign(g);
    // Cool shift with redshift (frequency drop)
    diskColor.assign(mix(diskColor.mul(vec3(1.15, 0.55, 0.35)), diskColor, g));

    // Keplerian Doppler beaming
    const rotationSign = sign(uniforms.diskRotationSpeed);
    const vHat = vec3(
      sin(hitAngle).negate().mul(rotationSign),
      float(0.0),
      cos(hitAngle).mul(rotationSign),
    );
    // Cap β below c; ISCO ~ 6M so floor r at ~3M
    const beta = sqrt(M.div(max(hitR, M.mul(3.0)))).min(float(0.5));
    const cosTh = clamp(dot(vHat, rayDir), float(-1.0), float(1.0));
    const D = float(1.0).div(max(float(1.0).sub(beta.mul(cosTh)), float(0.12)));
    const boost = pow(D, float(2.5).mul(uniforms.dopplerStrength));
    diskColor.mulAssign(clamp(boost, float(0.35), float(2.5)));

    // Radial edges
    const edge = smoothstep(
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

    // Keplerian shear of FBM (physical-ish turbulence advection)
    const cycle = max(uniforms.turbulenceCycleTime, float(0.5));
    const t0 = time.mod(cycle);
    const blend = t0.div(cycle);
    const w = float(1.5);
    const phase0 = t0
      .mul(uniforms.diskRotationSpeed)
      .div(pow(max(hitR, float(0.5)), w));
    const phase1 = t0
      .add(cycle)
      .mul(uniforms.diskRotationSpeed)
      .div(pow(max(hitR, float(0.5)), w));
    const a0 = hitAngle.add(phase0);
    const a1 = hitAngle.add(phase1);
    const stretch = max(uniforms.turbulenceStretch, float(0.2));
    const p0 = vec3(
      hitR.mul(uniforms.turbulenceScale),
      cos(a0).div(stretch),
      sin(a0).div(stretch),
    );
    const p1 = vec3(
      hitR.mul(uniforms.turbulenceScale),
      cos(a1).div(stretch),
      sin(a1).div(stretch),
    );
    const turb = mix(
      fbm(p1, uniforms.turbulenceLacunarity, uniforms.turbulencePersistence),
      fbm(p0, uniforms.turbulenceLacunarity, uniforms.turbulencePersistence),
      blend,
    );
    const turb01 = clamp(turb, float(0.0), float(1.0));
    const struct = pow(turb01, max(uniforms.turbulenceSharpness, float(0.25)));
    // Opacity: continuous disk with turbulent modulation (not painted spirals)
    const opTurb = mix(float(0.35), float(1.0), struct);

    // Mild limb brightening when edge-on (path length through slab handled in volume;
    // this is residual surface factor)
    const limb = mix(
      float(0.92),
      float(1.08),
      float(1.0).sub(abs(rayDir.y).mul(0.7).min(float(1.0))),
    );

    const opacity = clamp(opTurb.mul(edge).mul(limb), float(0.0), float(1.0));

    const tint = uniforms.diskTint.xyz.mul(uniforms.diskTint.w);
    const tintLum = dot(tint, vec3(0.2126, 0.7152, 0.0722));
    // Soften pure-white theme tints slightly
    const tintSafe = mix(
      tint,
      mix(tint, vec3(1.0, 0.9, 0.82), float(0.5)),
      smoothstep(float(0.9), float(0.99), tintLum),
    );

    const raw = diskColor.mul(tintSafe).mul(uniforms.diskBrightness);
    // Soft knee against blowout
    const lit = raw.div(raw.add(vec3(1.0))).mul(1.2);
    const emissive = mix(raw, lit, float(0.65));
    const finalCol = mix(emissive, tintSafe, uniforms.diskInkMode);
    const inkBoost = mix(float(1.0), float(1.3), uniforms.diskInkMode);

    return vec4(finalCol, clamp(opacity.mul(inkBoost), float(0.0), float(1.0)));
  });
