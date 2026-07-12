// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/**
 * Schwarzschild raymarch (dgreenheck port) — Three.js TSL.
 * Export: createBlackHoleShader(uniforms) → colorNode for MeshBasicNodeMaterial.
 */

import type { BlackHoleUniforms } from "../mesh";
import {
  vec2,
  vec3,
  vec4,
  float,
  Fn,
  length,
  normalize,
  cross,
  atan,
  sqrt,
  pow,
  max,
  min,
  smoothstep,
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
    const camForward = normalize(camTarget.sub(camPos));
    const worldUp = vec3(0.0, 1.0, 0.0);
    const camRight = normalize(cross(worldUp, camForward));
    const camUp = cross(camForward, camRight);

    const fov = float(1.0);
    const rayDir = normalize(
      camForward
        .mul(fov)
        .add(camRight.mul(screenPos.x))
        .add(camUp.mul(screenPos.y)),
    ).toVar("rayDir");

    // Ray state
    const rayPos = camPos.toVar("rayPos");
    const prevPos = camPos.toVar("prevPos");
    const color = vec3(0.0, 0.0, 0.0).toVar("color");
    const alpha = float(0.0).toVar("alpha");
    const escaped = float(0.0).toVar("escaped");
    const captured = float(0.0).toVar("captured");
    // Closest approach — soft photon-ring / horizon AA
    const minR = float(1.0e6).toVar("minR");

    const innerR = uniforms.diskInnerRadius;
    const outerR = uniforms.diskOuterRadius;

    // More steps + adaptive size near hole → smoother critical curve when zoomed out
    Loop(96, () => {
      If(
        escaped
          .greaterThan(0.5)
          .or(captured.greaterThan(0.5))
          .or(alpha.greaterThan(0.99)),
        () => {
          Break();
        },
      );

      const r = length(rayPos);
      minR.assign(min(minR, r));

      // Hard capture only deep inside (soft edge at composite)
      If(r.lessThan(rs.mul(0.9)), () => {
        captured.assign(1.0);
        Break();
      });

      If(r.greaterThan(100.0), () => {
        escaped.assign(1.0);
        Break();
      });

      // Much finer steps near the hole — thin photon ring aliases badly at coarse steps
      const nearHole = float(1.0).sub(
        smoothstep(rs.mul(1.05), rs.mul(14.0), r),
      );
      const dt = uniforms.stepSize.mul(mix(float(1.0), float(0.12), nearHole));

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
        const tHit = prevPos.y.negate().div(rayPos.y.sub(prevPos.y));
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

    // Soft void edge + screen-space AA (fwidth) so thin rims aren't harsh 1px lines
    const aaW = max(fwidth(minR).mul(2.25), rs.mul(0.025));
    const softCapture = float(1.0)
      .sub(smoothstep(rs.mul(0.88).sub(aaW), rs.mul(1.95).add(aaW), minR))
      .toVar("softCapture");
    If(captured.greaterThan(0.5), () => {
      softCapture.assign(1.0);
    });

    const skyOk = float(1.0).sub(softCapture);

    If(softCapture.lessThan(0.88), () => {
      escaped.assign(1.0);
    });

    const starsCol = vec3(0.0, 0.0, 0.0).toVar("starsCol");
    const nebCol = vec3(0.0, 0.0, 0.0).toVar("nebCol");

    If(escaped.greaterThan(0.5).and(alpha.lessThan(0.99)), () => {
      If(uniforms.starsEnabled.greaterThan(0.5), () => {
        starsCol.assign(starField(rayDir));
      });
      If(uniforms.nebulaEnabled.greaterThan(0.5), () => {
        nebCol.assign(nebulaField(rayDir));
      });
    });

    // Mild peak compression — keep punch for the ring
    const contentGamma = pow(max(color, vec3(0.0)), vec3(1.0 / 2.2)).toVar(
      "contentGamma",
    );
    const contentTone = mix(
      contentGamma,
      contentGamma.div(contentGamma.add(vec3(0.75))),
      float(0.32),
    ).toVar("contentTone");

    // Photon sphere ~1.5 rs — soft AA band + slight visibility boost
    const photonR = rs.mul(1.5);
    const distPhoton = minR.sub(photonR).abs();
    const photonAa = max(fwidth(minR).mul(2.5), rs.mul(0.05));
    const photonMask = float(1.0)
      .sub(smoothstep(float(0.0), photonAa.add(rs.mul(0.14)), distPhoton))
      .toVar("photonMask");
    // Bring the rim back up a bit, then lightly compress pure white peaks only
    contentTone.assign(mix(contentTone, contentTone.mul(1.22), photonMask));
    contentTone.assign(
      mix(
        contentTone,
        contentTone.div(contentTone.add(vec3(0.9))).mul(1.05),
        photonMask.mul(0.35),
      ),
    );

    // Soften void transition band (AA, not erase)
    const edgeBand = softCapture.mul(float(1.0).sub(softCapture)).mul(4.0);
    contentTone.assign(
      mix(
        contentTone,
        contentTone.mul(0.94),
        clamp(edgeBand, float(0.0), float(1.0)),
      ),
    );

    const cover = mix(alpha, float(1.0), softCapture);

    // Content only — never paint the void. Discard leaves the clear color
    // (transparent) so the host shell `bg-background` shows through.
    // WebGPU canvas uses alphaMode: 'premultiplied' when alpha:true.
    const finalColor = contentTone.mul(cover).toVar("finalColor");
    const outAlpha = cover.toVar("outAlpha");

    If(uniforms.nebulaEnabled.greaterThan(0.5), () => {
      const n = nebCol.mul(float(1.0).sub(alpha)).mul(skyOk);
      finalColor.addAssign(n);
      outAlpha.assign(max(outAlpha, max(n.x, max(n.y, n.z))));
    });

    If(uniforms.starsEnabled.greaterThan(0.5), () => {
      const starsLit = pow(max(starsCol, vec3(0.0)), vec3(1.0 / 2.2)).mul(3.0);
      const s = starsLit.mul(float(1.0).sub(alpha)).mul(skyOk);
      finalColor.addAssign(s);
      outAlpha.assign(max(outAlpha, max(s.x, max(s.y, s.z))));
    });

    finalColor.assign(clamp(finalColor, float(0.0), float(1.12)));
    outAlpha.assign(clamp(outAlpha, float(0.0), float(1.0)));

    // Hard void cut — more reliable than alpha blend alone (bloom/post often force a=1).
    Discard(outAlpha.lessThan(0.004));

    // Premultiplied RGB for WebGPU canvas (alphaMode: 'premultiplied').
    return vec4(finalColor.mul(outAlpha), outAlpha);
  })();
}
