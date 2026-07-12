// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/**
 * Accretion disk — always-cloudy plasma packs.
 *
 * Why pure Kepler co-rotation fails long-term:
 *   φ − ω(r)·t with ω ∝ r^{-3/2} winds structure into smooth concentric rings.
 *
 * Fix:
 *   1. Large cloud packs orbit with solid-body rotation (blob shapes stable forever)
 *   2. Medium/fine use cyclic Kepler shear (crossfade) — differential flow, no wind-up
 *   3. Variable-size/density Worley cells for chaos that never washes out
 *   4. Multi-hue cloud tints + dimmed inner rim (less blinding ISCO glow)
 */

import type { BlackHoleUniforms } from "../mesh";
import {
  vec2,
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
  max,
  abs,
  dot,
  mix,
  smoothstep,
} from "three/tsl";
import { cellularClouds2D, fbm, noise3D } from "./noise";
import { blackbodyColor } from "./blackbody";

/** Solid-body rotating UV — cloud shapes stay blob-like forever. */
const solidUV = Fn(([hitR, hitAngle, time, omega0, sR, sPhi]) => {
  const r = max(hitR, float(0.35));
  const phi = hitAngle.sub(time.mul(omega0));
  return vec2(r.mul(sR), phi.mul(sPhi));
});

/**
 * Cyclic Kepler UV — shearTime is within one cycle only (bounded winding).
 */
const keplerUV = Fn(([hitR, hitAngle, shearTime, speed, sR, sPhi]) => {
  const r = max(hitR, float(0.35));
  const omega = speed.div(pow(r, float(1.5)));
  const phi = hitAngle.sub(shearTime.mul(omega));
  return vec2(r.mul(sR), phi.mul(sPhi));
});

export const createAccretionDiskColor = (uniforms: BlackHoleUniforms) =>
  Fn(([hitR, hitAngle, time, rayDir]) => {
    const M = uniforms.blackHoleMass;
    const rs = M.mul(2.0);
    const innerR = uniforms.diskInnerRadius;
    const outerR = uniforms.diskOuterRadius;
    const span = max(outerR.sub(innerR), float(1.0e-3));
    const normR = clamp(hitR.sub(innerR).div(span), float(0.0), float(1.0));

    // ── Temperature / color ────────────────────────────────────────────────
    const peakK = uniforms.diskTemperature.mul(1000.0);
    const tempK = peakK.mul(
      pow(innerR.div(max(hitR, float(1.0e-3))), uniforms.temperatureFalloff),
    );
    const diskColor = blackbodyColor(tempK).toVar("diskColor");

    const lum = dot(diskColor, vec3(0.2126, 0.7152, 0.0722));
    diskColor.assign(
      mix(vec3(lum, lum, lum), diskColor, uniforms.diskSaturation),
    );

    const rSafe = max(hitR, rs.mul(1.05));
    const g = sqrt(max(float(1.0).sub(rs.div(rSafe)), float(0.08)));
    diskColor.mulAssign(g);
    diskColor.assign(mix(diskColor.mul(vec3(1.22, 0.55, 0.32)), diskColor, g));

    const rotSign = sign(uniforms.diskRotationSpeed);
    const vHat = vec3(
      sin(hitAngle).negate().mul(rotSign),
      float(0.0),
      cos(hitAngle).mul(rotSign),
    );
    const beta = sqrt(M.div(max(hitR, M.mul(3.0)))).min(float(0.5));
    const cosTh = clamp(dot(vHat, rayDir), float(-1.0), float(1.0));
    const D = float(1.0).div(max(float(1.0).sub(beta.mul(cosTh)), float(0.12)));
    const boost = pow(D, float(3.0).mul(uniforms.dopplerStrength));
    diskColor.mulAssign(clamp(boost, float(0.2), float(4.5)));

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

    // ── Motion: solid-body + cyclic shear (no wind-up) ──────────────────────
    const speed = uniforms.diskRotationSpeed;
    const sc = uniforms.turbulenceScale;
    const rRef = mix(innerR, outerR, float(0.35));
    const omega0 = speed.div(pow(max(rRef, float(0.5)), float(1.5)));

    const cycle = max(uniforms.turbulenceCycleTime, float(2.0));
    const t0 = time.mod(cycle);
    const t1 = t0.add(cycle);
    const blend = t0.div(cycle);

    const sR = sc.mul(0.95);
    const sPhi = sc.mul(1.85);

    // ── Large packs: solid-body (always cloudy) ────────────────────────────
    const uvBig = solidUV(
      hitR,
      hitAngle,
      time,
      omega0,
      sR.mul(0.48),
      sPhi.mul(0.7),
    );
    const wBig = noise3D(vec3(uvBig.x, uvBig.y, time.mul(0.03))).sub(0.5);
    const big = cellularClouds2D(
      uvBig.add(vec2(wBig.mul(0.65), wBig.mul(0.55))),
      float(0.28),
      float(1.15),
      float(0.5),
      float(1.35),
    );

    // ── Medium: cyclic Kepler shear ────────────────────────────────────────
    const uvM0 = keplerUV(
      hitR,
      hitAngle,
      t0,
      speed,
      sR.mul(1.05),
      sPhi.mul(1.15),
    );
    const uvM1 = keplerUV(
      hitR,
      hitAngle,
      t1,
      speed,
      sR.mul(1.05),
      sPhi.mul(1.15),
    );
    const med0 = cellularClouds2D(
      uvM0,
      float(0.22),
      float(0.95),
      float(0.4),
      float(1.25),
    );
    const med1 = cellularClouds2D(
      uvM1,
      float(0.22),
      float(0.95),
      float(0.4),
      float(1.25),
    );
    const med = mix(med1, med0, blend);

    // ── Fine: faster cyclic shear ──────────────────────────────────────────
    const uvF0 = keplerUV(
      hitR,
      hitAngle,
      t0,
      speed.mul(1.2),
      sR.mul(2.0),
      sPhi.mul(1.9),
    );
    const uvF1 = keplerUV(
      hitR,
      hitAngle,
      t1,
      speed.mul(1.2),
      sR.mul(2.0),
      sPhi.mul(1.9),
    );
    const fine0 = cellularClouds2D(
      uvF0,
      float(0.18),
      float(0.75),
      float(0.35),
      float(1.15),
    );
    const fine1 = cellularClouds2D(
      uvF1,
      float(0.18),
      float(0.75),
      float(0.35),
      float(1.15),
    );
    const fine = mix(fine1, fine0, blend);

    // ── Extra chaos (solid body, offset) ───────────────────────────────────
    const uvC = solidUV(
      hitR,
      hitAngle,
      time,
      omega0.mul(0.9),
      sR.mul(0.7),
      sPhi.mul(1.0),
    ).add(vec2(5.1, 3.3));
    const chaos = cellularClouds2D(
      uvC,
      float(0.24),
      float(1.0),
      float(0.35),
      float(1.3),
    );

    // FBM texture in solid frame
    const phiS = hitAngle.sub(time.mul(omega0));
    const fbmP = vec3(
      hitR.mul(sc.mul(1.55)),
      cos(phiS).mul(sc.mul(1.05)),
      sin(phiS).mul(sc.mul(1.05)),
    ).add(vec3(time.mul(0.08), 0.0, time.mul(0.06)));
    const turb = clamp(
      fbm(fbmP, uniforms.turbulenceLacunarity, uniforms.turbulencePersistence),
      float(0.0),
      float(1.0),
    );
    const turbDetail = pow(
      turb,
      max(uniforms.turbulenceSharpness.mul(0.4), float(0.4)),
    );

    // Thickness fluctuation
    const thickNoise = noise3D(
      vec3(hitR.mul(sc.mul(0.8)), phiS.mul(1.2), time.mul(0.07)),
    );
    const thickVar = mix(float(0.75), float(1.2), thickNoise);

    // Multi-scale cloudy mix
    const clouds = clamp(
      big
        .mul(0.65)
        .add(med.mul(0.58))
        .add(fine.mul(0.5))
        .add(chaos.mul(0.55))
        .add(big.mul(med).mul(0.5))
        .add(fine.mul(chaos).mul(0.35))
        .add(big.mul(fine).mul(0.25))
        .add(med.mul(chaos).mul(0.3)),
      float(0.0),
      float(1.0),
    );

    const struct = clamp(
      clouds.mul(mix(float(0.55), float(1.28), turbDetail)).mul(thickVar),
      float(0.0),
      float(1.0),
    );

    // Dense filled gas + cloud peaks
    const density = mix(float(0.58), float(1.0), pow(struct, float(0.5)))
      .mul(edge)
      .mul(thickVar);
    const emitMod = mix(float(0.35), float(2.55), pow(struct, float(0.55)));
    // Dim the blinding inner rim near ISCO
    const innerDim = mix(
      float(0.52),
      float(1.0),
      smoothstep(float(0.0), float(0.38), normR),
    );

    // ── Multi-hue cloud color variation ────────────────────────────────────
    const hueN = noise3D(
      vec3(
        hitR.mul(sc.mul(0.55)),
        phiS.mul(1.4),
        time.mul(0.05).add(struct.mul(0.3)),
      ),
    );
    const hueN2 = noise3D(
      vec3(hitR.mul(sc.mul(1.1)), phiS.mul(2.1).add(2.5), time.mul(0.07)),
    );
    const cPeach = vec3(1.15, 0.78, 0.55);
    const cCopper = vec3(1.2, 0.55, 0.28);
    const cRust = vec3(0.95, 0.38, 0.18);
    const cAmber = vec3(1.25, 0.9, 0.5);
    const cCream = vec3(1.2, 1.0, 0.82);
    const hA = mix(cRust, cCopper, clamp(hueN, float(0.0), float(1.0)));
    const hB = mix(cPeach, cAmber, clamp(hueN2, float(0.0), float(1.0)));
    const cloudTint = mix(
      hA,
      hB,
      clamp(struct.mul(0.55).add(hueN.mul(0.45)), float(0.0), float(1.0)),
    );
    const coreTint = mix(cloudTint, cCream, pow(struct, float(1.3)).mul(0.4));

    const coolLane = mix(
      vec3(1.0, 1.0, 1.0),
      vec3(1.1, 0.42, 0.2),
      float(1.0)
        .sub(struct)
        .mul(smoothstep(float(0.1), float(0.95), normR)),
    );
    const outerRust = mix(
      vec3(1.0, 1.0, 1.0),
      vec3(1.05, 0.48, 0.24),
      smoothstep(float(0.3), float(1.0), normR).mul(0.6),
    );
    const innerCool = mix(
      vec3(1.0, 0.72, 0.52),
      vec3(1.0, 1.0, 1.0),
      smoothstep(float(0.0), float(0.42), normR),
    );

    const limb = mix(
      float(0.9),
      float(1.14),
      float(1.0).sub(abs(rayDir.y).mul(0.65).min(float(1.0))),
    );

    const tint = uniforms.diskTint.xyz.mul(uniforms.diskTint.w);
    const tintLum = dot(tint, vec3(0.2126, 0.7152, 0.0722));
    const tintSafe = mix(
      tint,
      mix(tint, vec3(1.0, 0.84, 0.68), float(0.5)),
      smoothstep(float(0.88), float(0.99), tintLum),
    );

    const warm = mix(
      diskColor,
      diskColor.mul(vec3(1.05, 0.62, 0.36)),
      float(0.35),
    )
      .mul(coreTint)
      .mul(coolLane)
      .mul(outerRust)
      .mul(innerCool)
      .mul(tintSafe);

    const raw = warm
      .mul(uniforms.diskBrightness)
      .mul(emitMod)
      .mul(limb)
      .mul(innerDim);
    const lit = raw.div(raw.add(vec3(0.55))).mul(1.35);
    const emissive = mix(raw, lit, float(0.4));
    const finalCol = mix(emissive, tintSafe, uniforms.diskInkMode);
    const inkBoost = mix(float(1.0), float(1.2), uniforms.diskInkMode);

    return vec4(finalCol, clamp(density.mul(inkBoost), float(0.0), float(1.0)));
  });
