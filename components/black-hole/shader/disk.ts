// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/**
 * Accretion disk — always-cloudy plasma packs + relativistic beaming.
 *
 * Seam fix: never sample noise in (r, φ) — atan branch cut makes a radial line
 * where the disk “ends don’t meet”. All cloud fields use continuous co-rotating
 * Cartesian (r·cos φ, r·sin φ).
 *
 * Motion:
 *   1. Large packs — solid-body rotation (blob shapes stable forever)
 *   2. Medium/fine — cyclic Kepler shear (crossfade, no wind-up rings)
 *   3. Variable-size Worley + multi-hue peach + mild spiral domain warp
 *   4. Dark lanes (emit-dim, not holes) · outer wisps · sparse hotspots
 *
 * Physics polish:
 *   Doppler brightness (≈ I∝ν³) + color shift (approaching hotter, receding rust)
 *   Stronger innerDim / cool inner so photon-ring shoulder isn’t a white plate
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
  min,
  abs,
  log,
  exp,
  dot,
  mix,
  smoothstep,
} from "three/tsl";
import { cellularClouds2D, fbm, noise3D } from "./noise";
import { blackbodyColor } from "./blackbody";

/**
 * Continuous co-rotating Cartesian UV (seamless around 2π).
 * Optional orbital stretch: scale radial vs tangential in the local frame
 * without ever using φ as a linear coordinate.
 */
const cartUV = Fn(([hitR, phi, sRad, sTan]) => {
  const r = max(hitR, float(0.35));
  const c = cos(phi);
  const s = sin(phi);
  const x = r.mul(c);
  const z = r.mul(s);
  const base = vec2(x, z).mul(sTan);
  const radialPush = vec2(c, s).mul(r.mul(sRad.sub(sTan)));
  return base.add(radialPush);
});

/** Mild log-spiral domain warp in seamless Cartesian UV (no linear φ). */
const spiralWarpUV = Fn(([uv, amount]) => {
  // Rotate UV slightly: adds arm bias without vinyl rings
  const k = amount;
  return uv.add(vec2(uv.y.negate(), uv.x).mul(k));
});

/** Solid-body phase. */
const solidPhi = Fn(([hitAngle, time, omega0]) => {
  return hitAngle.sub(time.mul(omega0));
});

/** Cyclic Kepler phase (bounded shear time). */
const keplerPhi = Fn(([hitR, hitAngle, shearTime, speed]) => {
  const r = max(hitR, float(0.35));
  const omega = speed.div(pow(r, float(1.5)));
  return hitAngle.sub(shearTime.mul(omega));
});

export const createAccretionDiskColor = (uniforms: BlackHoleUniforms) =>
  Fn(([hitR, hitAngle, hitY, time, rayDir]) => {
    const M = uniforms.blackHoleMass;
    const rs = M.mul(2.0);
    const innerR = uniforms.diskInnerRadius;
    const outerR = uniforms.diskOuterRadius;
    const span = max(outerR.sub(innerR), float(1.0e-3));
    const normR = clamp(hitR.sub(innerR).div(span), float(0.0), float(1.0));
    // Local flared scale height (matches march) for vertical structure
    const h0 = max(uniforms.diskScaleHeight, float(0.08));
    const hLocal = h0.mul(
      pow(max(hitR.div(max(innerR, float(0.5))), float(0.6)), float(0.85)),
    );
    const yAbs = abs(hitY);
    const yN = yAbs.div(max(hLocal, float(0.05)));

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

    // Gravitational redshift → cooler/dimmer near hole
    const rSafe = max(hitR, rs.mul(1.05));
    const g = sqrt(max(float(1.0).sub(rs.div(rSafe)), float(0.08)));
    diskColor.mulAssign(g);
    diskColor.assign(mix(diskColor.mul(vec3(1.28, 0.48, 0.28)), diskColor, g));

    // Relativistic Doppler beaming (brightness ≈ I∝ν³) + color shift
    // Real disks: approaching side bright/hotter; receding dim/redder.
    // (Interstellar often muted Doppler for aesthetics — we keep it for realism.)
    const rotSign = sign(uniforms.diskRotationSpeed);
    const vHat = vec3(
      sin(hitAngle).negate().mul(rotSign),
      float(0.0),
      cos(hitAngle).mul(rotSign),
    );
    const beta = sqrt(M.div(max(hitR, M.mul(3.0)))).min(float(0.55));
    const cosTh = clamp(dot(vHat, rayDir), float(-1.0), float(1.0));
    const D = float(1.0).div(max(float(1.0).sub(beta.mul(cosTh)), float(0.1)));
    // Power ~3 is Liouville I_ν ∝ ν³; strength scales further
    const boost = pow(D, float(3.05).mul(uniforms.dopplerStrength));
    // Cap hard so approach side stays peach, not a white plate
    const boostClamped = clamp(boost, float(0.18), float(3.6));
    diskColor.mulAssign(boostClamped);

    // Color shift: approach → warmer peach-amber; recede → deep rust
    // (avoid cream/silver wash on the bright limb)
    const approach = smoothstep(float(1.0), float(2.0), boostClamped);
    const recede = float(1.0).sub(
      smoothstep(float(0.22), float(0.95), boostClamped),
    );
    diskColor.assign(
      mix(diskColor, diskColor.mul(vec3(1.1, 0.88, 0.68)), approach.mul(0.38)),
    );
    diskColor.assign(
      mix(diskColor, diskColor.mul(vec3(1.2, 0.4, 0.18)), recede.mul(0.72)),
    );

    // Edge falloff — clamp extremes so edgeSoftness 0 / 1 don't hard-clip
    const softIn = max(uniforms.diskEdgeSoftnessInner, float(0.02));
    const softOut = clamp(
      uniforms.diskEdgeSoftnessOuter,
      float(0.05),
      float(0.95),
    );
    const edge = smoothstep(float(0.0), softIn, normR).mul(
      smoothstep(float(1.0), float(1.0).sub(softOut), normR),
    );

    // ── Motion: solid-body + cyclic shear (seamless Cartesian) ─────────────
    const speed = uniforms.diskRotationSpeed;
    // Cap sc so extreme turbulenceScale (e.g. 10) doesn't destroy sampling
    const sc = min(uniforms.turbulenceScale, float(4.5));
    const rRef = mix(innerR, outerR, float(0.35));
    const omega0 = speed.div(pow(max(rRef, float(0.5)), float(1.5)));

    const cycle = max(uniforms.turbulenceCycleTime, float(2.0));
    const t0 = time.mod(cycle);
    const t1 = t0.add(cycle);
    const blend = t0.div(cycle);

    // sRad / sTan control radial vs orbital elongation (still seamless)
    const sRad = sc.mul(0.82);
    const sTan = sc.mul(1.42);

    // Mild spiral arm bias grows with radius (cart-space rotation, seamless)
    const spiralAmt = float(0.14)
      .mul(smoothstep(float(0.05), float(0.92), normR))
      .mul(log(max(hitR.div(max(innerR, float(0.5))), float(0.75))).add(0.35));

    // ── Large packs: solid-body (always cloudy, seamless) ──────────────────
    const phiBig = solidPhi(hitAngle, time, omega0);
    const uvBig0 = cartUV(hitR, phiBig, sRad.mul(0.45), sTan.mul(0.68));
    const uvBig = spiralWarpUV(uvBig0, spiralAmt.mul(0.85));
    const wBig = noise3D(vec3(uvBig.x, uvBig.y, time.mul(0.03))).sub(0.5);
    const big = cellularClouds2D(
      uvBig.add(vec2(wBig.mul(0.72), wBig.mul(0.58))),
      float(0.22),
      float(1.35),
      float(0.42),
      float(1.45),
    );

    // ── Medium: cyclic Kepler shear ────────────────────────────────────────
    const phiM0 = keplerPhi(hitR, hitAngle, t0, speed);
    const phiM1 = keplerPhi(hitR, hitAngle, t1, speed);
    const uvM0 = spiralWarpUV(
      cartUV(hitR, phiM0, sRad.mul(1.05), sTan.mul(1.2)),
      spiralAmt,
    );
    const uvM1 = spiralWarpUV(
      cartUV(hitR, phiM1, sRad.mul(1.05), sTan.mul(1.2)),
      spiralAmt,
    );
    const med0 = cellularClouds2D(
      uvM0,
      float(0.18),
      float(1.05),
      float(0.32),
      float(1.35),
    );
    const med1 = cellularClouds2D(
      uvM1,
      float(0.18),
      float(1.05),
      float(0.32),
      float(1.35),
    );
    const med = mix(med1, med0, blend);

    // ── Fine: faster cyclic shear ──────────────────────────────────────────
    const phiF0 = keplerPhi(hitR, hitAngle, t0, speed.mul(1.25));
    const phiF1 = keplerPhi(hitR, hitAngle, t1, speed.mul(1.25));
    const uvF0 = spiralWarpUV(
      cartUV(hitR, phiF0, sRad.mul(2.15), sTan.mul(2.0)),
      spiralAmt.mul(1.15),
    );
    const uvF1 = spiralWarpUV(
      cartUV(hitR, phiF1, sRad.mul(2.15), sTan.mul(2.0)),
      spiralAmt.mul(1.15),
    );
    const fine0 = cellularClouds2D(
      uvF0,
      float(0.14),
      float(0.82),
      float(0.28),
      float(1.25),
    );
    const fine1 = cellularClouds2D(
      uvF1,
      float(0.14),
      float(0.82),
      float(0.28),
      float(1.25),
    );
    const fine = mix(fine1, fine0, blend);

    // ── Extra chaos (solid body, offset) ───────────────────────────────────
    const phiC = solidPhi(hitAngle, time, omega0.mul(0.9));
    const uvC = spiralWarpUV(
      cartUV(hitR, phiC, sRad.mul(0.7), sTan.mul(1.05)).add(vec2(5.1, 3.3)),
      spiralAmt.mul(0.7),
    );
    const chaos = cellularClouds2D(
      uvC,
      float(0.2),
      float(1.12),
      float(0.28),
      float(1.4),
    );

    // ── Outer arm wisps (tangentially stretched, high normR only) ──────────
    const uvW0 = cartUV(hitR, phiF0, sRad.mul(3.4), sTan.mul(0.48));
    const uvW1 = cartUV(hitR, phiF1, sRad.mul(3.4), sTan.mul(0.48));
    const wisp0 = cellularClouds2D(
      uvW0,
      float(0.1),
      float(0.55),
      float(0.15),
      float(1.2),
    );
    const wisp1 = cellularClouds2D(
      uvW1,
      float(0.1),
      float(0.55),
      float(0.15),
      float(1.2),
    );
    const wisp = mix(wisp1, wisp0, blend);
    const wispMask = smoothstep(float(0.42), float(0.95), normR);

    // ── Sparse hotspots (solid-body coarse packs — orbit with big clouds) ──
    const uvHot = cartUV(hitR, phiBig, sRad.mul(0.28), sTan.mul(0.4));
    const hotRaw = cellularClouds2D(
      uvHot.add(vec2(2.7, -1.4)),
      float(0.32),
      float(0.95),
      float(0.0),
      float(1.85),
    );
    // Only the rare peaks light up as knots
    const hotspot = pow(
      clamp(hotRaw.sub(float(0.78)).mul(float(5.5)), float(0.0), float(1.0)),
      float(1.4),
    );

    // FBM texture in solid frame — continuous cos/sin embedding (no φ line)
    const phiS = solidPhi(hitAngle, time, omega0);
    const cS = cos(phiS);
    const sS = sin(phiS);
    const fbmP = vec3(
      hitR.mul(cS).mul(sc.mul(1.6)),
      hitR.mul(sS).mul(sc.mul(1.6)),
      time.mul(0.08),
    );
    const turb = clamp(
      fbm(fbmP, uniforms.turbulenceLacunarity, uniforms.turbulencePersistence),
      float(0.0),
      float(1.0),
    );
    const turbDetail = pow(
      turb,
      max(uniforms.turbulenceSharpness.mul(0.42), float(0.45)),
    );

    // Thickness fluctuation — also Cartesian seamless
    const thickNoise = noise3D(
      vec3(
        hitR.mul(cS).mul(sc.mul(0.8)),
        hitR.mul(sS).mul(sc.mul(0.8)),
        time.mul(0.07),
      ),
    );
    const thickVar = mix(float(0.72), float(1.28), thickNoise);

    // Vertical billows — denser midplane cores, wispy faces of the slab
    // (hitY from march mid-sample; seamless 3D noise in solid frame)
    const vertNoise = noise3D(
      vec3(
        hitR.mul(cS).mul(sc.mul(1.05)),
        hitY.mul(float(2.8)).add(time.mul(0.05)),
        hitR.mul(sS).mul(sc.mul(1.05)),
      ),
    );
    const midplaneCore = exp(yN.mul(yN).mul(float(-1.15)));
    const faceWisp = smoothstep(float(0.15), float(0.95), yN).mul(
      mix(float(0.55), float(1.25), vertNoise),
    );
    const heightMod = mix(
      mix(float(0.82), float(1.18), vertNoise).mul(midplaneCore.add(0.35)),
      float(1.0).add(faceWisp.mul(0.45)),
      smoothstep(float(0.2), float(0.85), yN),
    );

    // Dark lanes: low-turbulence corridors — dim emission, keep opacity floor
    const laneN = noise3D(
      vec3(
        hitR.mul(cS).mul(sc.mul(0.42)),
        hitR.mul(sS).mul(sc.mul(0.42)),
        time.mul(0.045).add(2.1),
      ),
    );
    // breakMask ~1 in open gas, ~0.45–0.55 in lanes
    const breakMask = mix(
      float(0.45),
      float(1.0),
      smoothstep(float(0.26), float(0.74), laneN)
        .mul(smoothstep(float(0.2), float(0.7), turb))
        .mul(mix(float(0.85), float(1.0), float(1.0).sub(wispMask.mul(0.25)))),
    );

    // Multi-scale cloudy mix — more multiplicative structure (harder packs)
    const clouds = clamp(
      big
        .mul(0.74)
        .add(med.mul(0.64))
        .add(fine.mul(0.55))
        .add(chaos.mul(0.6))
        .add(wisp.mul(wispMask).mul(0.75))
        .add(big.mul(med).mul(0.68))
        .add(fine.mul(chaos).mul(0.48))
        .add(big.mul(fine).mul(0.36))
        .add(med.mul(chaos).mul(0.4))
        .add(hotspot.mul(0.95))
        .add(big.mul(chaos).mul(med).mul(0.22)),
      float(0.0),
      float(1.0),
    );

    const struct = clamp(
      clouds
        .mul(mix(float(0.48), float(1.4), turbDetail))
        .mul(thickVar)
        .mul(heightMod)
        .mul(mix(float(0.88), float(1.1), breakMask)),
      float(0.0),
      float(1.0),
    );

    // Opaque floor + cloud peaks — slightly lower floor so dim lanes don't matte
    const density = mix(float(0.38), float(1.0), pow(struct, float(0.48)))
      .mul(edge)
      .mul(thickVar)
      .mul(mix(float(0.9), float(1.05), heightMod))
      .mul(mix(float(0.78), float(1.0), breakMask));

    // Wide emit range + lanes dim emit hard + hotspot punch
    const emitMod = mix(float(0.3), float(3.05), pow(struct, float(0.5)))
      .mul(mix(float(0.4), float(1.0), breakMask))
      .mul(float(1.0).add(hotspot.mul(1.85)))
      .mul(float(1.0).add(wisp.mul(wispMask).mul(0.4)))
      .mul(mix(float(0.92), float(1.12), midplaneCore));

    // Dim blinding ISCO shoulder (thin hot band, not white plate)
    const innerDim = mix(
      float(0.34),
      float(1.0),
      smoothstep(float(0.0), float(0.55), normR),
    );

    // ── Multi-hue cloud color (seamless Cartesian) ─────────────────────────
    const hueN = noise3D(
      vec3(
        hitR.mul(cS).mul(sc.mul(0.55)),
        hitR.mul(sS).mul(sc.mul(0.55)),
        time.mul(0.05).add(struct.mul(0.3)),
      ),
    );
    const hueN2 = noise3D(
      vec3(
        hitR.mul(cS).mul(sc.mul(1.1)).add(2.5),
        hitR.mul(sS).mul(sc.mul(1.1)),
        time.mul(0.07),
      ),
    );
    const cPeach = vec3(1.15, 0.78, 0.55);
    const cCopper = vec3(1.22, 0.52, 0.26);
    const cRust = vec3(0.92, 0.34, 0.16);
    const cAmber = vec3(1.28, 0.88, 0.48);
    const hA = mix(cRust, cCopper, clamp(hueN, float(0.0), float(1.0)));
    const hB = mix(cPeach, cAmber, clamp(hueN2, float(0.0), float(1.0)));
    const cloudTint = mix(
      hA,
      hB,
      clamp(struct.mul(0.55).add(hueN.mul(0.45)), float(0.0), float(1.0)),
    );
    // Dense cores lean amber (not silver); hotspots slightly hotter
    const coreTint = mix(
      cloudTint,
      mix(cAmber, cPeach, float(0.55)),
      pow(struct, float(1.25)).mul(0.32).add(hotspot.mul(0.22)),
    );

    // Thin inter-cloud gas + outer arms lean rust; lanes cooler still
    const coolLane = mix(
      vec3(1.0, 1.0, 1.0),
      vec3(1.12, 0.38, 0.18),
      float(1.0)
        .sub(struct)
        .mul(smoothstep(float(0.08), float(0.95), normR))
        .mul(mix(float(1.15), float(0.85), breakMask)),
    );
    const outerRust = mix(
      vec3(1.0, 1.0, 1.0),
      vec3(1.08, 0.45, 0.22),
      smoothstep(float(0.28), float(1.0), normR).mul(0.68),
    );
    // Cooler peach near ISCO (not silver-white)
    const innerCool = mix(
      vec3(1.08, 0.55, 0.36),
      vec3(1.0, 1.0, 1.0),
      smoothstep(float(0.0), float(0.55), normR),
    );

    const limb = mix(
      float(0.88),
      float(1.16),
      float(1.0).sub(abs(rayDir.y).mul(0.65).min(float(1.0))),
    );

    const tint = uniforms.diskTint.xyz.mul(uniforms.diskTint.w);
    const tintLum = dot(tint, vec3(0.2126, 0.7152, 0.0722));
    // Never let pure white/foreground tint wash the disk into a plate
    const tintSafe = mix(
      tint,
      mix(tint, vec3(1.0, 0.82, 0.64), float(0.65)),
      smoothstep(float(0.82), float(0.98), tintLum),
    );

    const warm = mix(
      diskColor,
      diskColor.mul(vec3(1.06, 0.58, 0.32)),
      float(0.38),
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
    // Slightly softer knee so structure survives highlight roll-off
    const lit = raw.div(raw.add(vec3(0.62))).mul(1.32);
    const emissive = mix(raw, lit, float(0.38));
    const finalCol = mix(emissive, tintSafe, uniforms.diskInkMode);
    const inkBoost = mix(float(1.0), float(1.2), uniforms.diskInkMode);

    return vec4(finalCol, clamp(density.mul(inkBoost), float(0.0), float(1.0)));
  });
