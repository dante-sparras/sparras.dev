// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).

/**
 * Schwarzschild null geodesics via the stable equatorial u–φ ODE (G = c = 1):
 *
 *   u = 1/r
 *   d²u/dφ² + u = 3 M u²          (exact equatorial null equation)
 *
 * Each ray lives in the plane spanned by r₀ × k₀ (L̂ normal). We integrate
 * (u, w=du/dφ) with RK2 in φ, rebuild Cartesian position, and sample the disk
 * slab only on midplane crossings (max 2) so multi-wind photon orbits cannot
 * paint concentric “eye” rings.
 *
 * rs = 2M · photon sphere r = 3M · b_crit = 3√3 M
 */
import type { BlackHoleUniforms } from "../mesh";
import {
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
  tan,
  cos,
  sin,
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

const PI = float(Math.PI);

export function createBlackHoleShader(uniforms: BlackHoleUniforms) {
  const starField = createStarField(uniforms);
  const nebulaField = createNebulaField(uniforms);
  const accretionDiskColor = createAccretionDiskColor(uniforms);

  return Fn(() => {
    const M = uniforms.blackHoleMass;
    const rs = M.mul(2.0); // 2M
    const photonR = M.mul(3.0); // 3M
    const bCrit = M.mul(float(5.1961524227)); // 3√3 M

    // ── Camera ray ─────────────────────────────────────────────────────────
    const ndc = screenUV.sub(0.5).mul(2.0);
    const aspect = uniforms.resolution.x.div(
      max(uniforms.resolution.y, float(1.0)),
    );
    const tanHalf = tan(uniforms.cameraFov.mul(0.5).mul(PI.div(180.0)));

    const camPos = uniforms.cameraPosition;
    const camForward = normalize(uniforms.cameraTarget.sub(camPos));
    const worldUp = vec3(0.0, 1.0, 0.0);
    const upDot = abs(dot(camForward, worldUp));
    const safeUp = mix(worldUp, vec3(0.0, 0.0, 1.0), step(float(0.95), upDot));
    const camRight = normalize(cross(camForward, safeUp));
    const camUp = cross(camRight, camForward);

    const k0 = normalize(
      camForward
        .add(camRight.mul(ndc.x.mul(aspect).mul(tanHalf)))
        .add(camUp.mul(ndc.y.mul(tanHalf))),
    );

    // ── Orbital plane + conserved L ────────────────────────────────────────
    const pos0 = camPos;
    const r0 = max(length(pos0), float(1.0e-3));
    const Lvec = cross(pos0, k0);
    const L = length(Lvec);
    const Lhat = mix(
      normalize(cross(k0, pos0.div(r0)).add(vec3(0.0, 1.0e-5, 0.0))),
      Lvec.div(max(L, float(1.0e-6))),
      step(float(1.0e-5), L),
    );

    // Plane basis: eR0 along projected position, ePhi = L̂ × eR0
    const eR0 = normalize(pos0.sub(Lhat.mul(dot(pos0, Lhat))));
    const ePhi0 = cross(Lhat, eR0);

    // Impact parameter b ≈ L (with |k₀|=1 far away). Critical capture: b < b_crit
    const b = L; // asymptotic |k|=1
    // Radial velocity sign for initial w = du/dφ = −ṙ/L
    const kr0 = dot(k0, pos0.div(r0));
    // u = 1/r, w = du/dφ = −ṙ / L   (since dφ/dλ = L/r², ṙ = dr/dλ)
    // For |k|~1 far: dφ/dλ ≈ L/r², but ṙ = kr. With affine |k|≈1: w = −kr * r² / L * (1/r²) = −kr/L
    const u = float(1.0).div(r0).toVar("u");
    const w = float(0.0)
      .sub(kr0.div(max(L, float(1.0e-5))))
      .toVar("w"); // du/dφ

    // Azimuth in plane (for reconstruction)
    const phi = float(0.0).toVar("phi");
    // Track total |Δφ| to kill multi-wind
    const phiTravel = float(0.0).toVar("phiTravel");

    // Cartesian position / direction for disk + sky
    const pos = eR0.mul(r0).toVar("pos");
    const prevPos = pos.toVar("prevPos");
    const rayDir = k0.toVar("rayDir");
    const prevY = pos.y.toVar("prevY");

    const color = vec3(0.0, 0.0, 0.0).toVar("color");
    const alpha = float(0.0).toVar("alpha");
    const escaped = float(0.0).toVar("escaped");
    const captured = float(0.0).toVar("captured");
    const minR = r0.toVar("minR");
    // Disk midplane crossings (primary + at most one secondary)
    const crossings = float(0.0).toVar("crossings");

    const innerR = uniforms.diskInnerRadius;
    const outerR = uniforms.diskOuterRadius;

    // dφ step scale (gravitationalLensing ~ 1). Smaller = more accurate.
    const dφ0 = uniforms.stepSize
      .mul(float(0.085))
      .mul(uniforms.gravitationalLensing)
      .max(float(0.004));

    // Nearly critical rays fall to the hole (unstable photon orbit)
    const isCritical = float(1.0).sub(
      smoothstep(bCrit.mul(0.97), bCrit.mul(1.03), b),
    );

    Loop(160, () => {
      If(
        escaped
          .greaterThan(0.5)
          .or(captured.greaterThan(0.5))
          .or(alpha.greaterThan(0.995)),
        () => {
          Break();
        },
      );

      const r = float(1.0).div(max(u, float(1.0e-5)));
      minR.assign(min(minR, r));

      // Horizon
      If(r.lessThanEqual(rs.mul(1.001)), () => {
        captured.assign(1.0);
        Break();
      });

      // Escaped: large r and moving outward (u decreasing → w < 0 means u drops → r grows)
      // w = du/dφ; outbound at large r has ṙ > 0 → w < 0
      If(r.greaterThan(150.0).and(w.lessThan(0.0)), () => {
        escaped.assign(1.0);
        Break();
      });
      If(r.greaterThan(220.0), () => {
        escaped.assign(1.0);
        Break();
      });

      // Multi-wind kill: more than ~1.25 turns near the hole → capture
      If(phiTravel.greaterThan(float(Math.PI).mul(2.2)), () => {
        captured.assign(1.0);
        Break();
      });
      // Critical impact + near photon sphere → capture
      If(
        isCritical
          .greaterThan(0.4)
          .and(r.lessThan(photonR.mul(2.5)))
          .and(r.greaterThan(rs.mul(1.05))),
        () => {
          // Only after some travel so we still get a thin photon ring
          If(phiTravel.greaterThan(0.35), () => {
            captured.assign(1.0);
            Break();
          });
        },
      );

      // Adaptive dφ: finer near photon sphere
      const nearPh = float(1.0).sub(
        smoothstep(photonR.mul(0.8), photonR.mul(3.0), r),
      );
      const dφ = dφ0.mul(mix(float(1.0), float(0.25), nearPh)).toVar("dφ");

      // Sign of dφ from L sense: advance φ always positive in orbital sense
      // (φ increases; radial dynamics in u,w)
      const dφStep = dφ;

      // RK2: d²u/dφ² = −u + 3 M u²
      const a1 = float(0.0).sub(u).add(M.mul(3.0).mul(u).mul(u));
      const uMid = u.add(w.mul(dφStep.mul(0.5)));
      const wMid = w.add(a1.mul(dφStep.mul(0.5)));
      const a2 = float(0.0).sub(uMid).add(M.mul(3.0).mul(uMid).mul(uMid));
      u.addAssign(wMid.mul(dφStep));
      w.addAssign(a2.mul(dφStep));
      phi.addAssign(dφStep);
      phiTravel.addAssign(abs(dφStep));

      // Rebuild Cartesian position in the orbital plane
      // Clamp u if numerically past horizon
      If(u.greaterThan(float(1.0).div(rs.mul(0.999))), () => {
        captured.assign(1.0);
        Break();
      });
      const rNew = float(1.0).div(max(u, float(1.0e-5)));

      const c = cos(phi);
      const s = sin(phi);
      // eR(φ) = cosφ eR0 + sinφ ePhi0
      const eR = eR0.mul(c).add(ePhi0.mul(s));
      const ePh = ePhi0.mul(c).sub(eR0.mul(s));
      prevPos.assign(pos);
      prevY.assign(pos.y);
      pos.assign(eR.mul(rNew));

      // Direction: k ∝ ṙ eR + r φ̇ ePh
      // ṙ = dr/dφ * dφ/dλ; with dφ/dλ = L/r² → ṙ = (dr/dφ) L/r²
      // dr/dφ = d(1/u)/dφ = −w/u²
      // So ṙ = −(w/u²) L / r² = −w L (since r=1/u, r²=1/u²)
      // k_r = ṙ, k_φ component = r * dφ/dλ = L/r
      // unit-ish direction for shading:
      const dr_dφ = float(0.0).sub(w.div(max(u.mul(u), float(1.0e-8))));
      const kVec = eR.mul(dr_dφ).add(ePh.mul(rNew));
      rayDir.assign(normalize(kVec.add(vec3(1.0e-8, 0.0, 0.0))));

      // ── Disk: sample only on midplane crossings (max 2) ─────────────────
      const crossed = prevY.mul(pos.y).lessThan(float(0.0));
      If(
        crossed.and(crossings.lessThan(2.5)).and(alpha.lessThan(0.995)),
        () => {
          // Intersection y=0 on segment
          const tHit = clamp(
            prevY.negate().div(pos.y.sub(prevY).add(float(1.0e-6))),
            float(0.0),
            float(1.0),
          );
          const hit = mix(prevPos, pos, tHit);
          const mR = sqrt(hit.x.mul(hit.x).add(hit.z.mul(hit.z)));
          const inDisk = mR
            .greaterThanEqual(innerR)
            .and(mR.lessThanEqual(outerR));

          If(inDisk, () => {
            crossings.addAssign(float(1.0));
            const hitAngle = atan(hit.z, hit.x);
            const disk = accretionDiskColor(
              mR,
              hitAngle,
              uniforms.time,
              rayDir,
            );
            // Surface opacity with mild radial density weight
            const dens = disk.w.mul(
              pow(max(innerR.div(max(mR, innerR)), float(0.15)), float(0.5)),
            );
            const stepA = dens.mul(float(0.85)).min(float(1.0));
            const rem = float(1.0).sub(alpha);
            color.addAssign(disk.xyz.mul(stepA).mul(rem));
            alpha.addAssign(rem.mul(stepA));
          });
        },
      );

      // Mild volume fill only near plane for thickness (no multi-orbit rings)
      If(
        crossings
          .lessThan(2.5)
          .and(alpha.lessThan(0.995))
          .and(abs(pos.y).lessThan(uniforms.diskScaleHeight.mul(2.0))),
        () => {
          const mR = sqrt(pos.x.mul(pos.x).add(pos.z.mul(pos.z)));
          const inDisk = mR
            .greaterThanEqual(innerR)
            .and(mR.lessThanEqual(outerR));
          If(inDisk.and(crossings.greaterThan(0.5)), () => {
            // Only after at least one plane cross — thin vertical soft
            const h = max(uniforms.diskScaleHeight, float(0.05));
            const vert = exp(
              abs(pos.y).div(h).mul(abs(pos.y).div(h)).mul(float(2.2)).negate(),
            );
            If(vert.greaterThan(0.05), () => {
              const hitAngle = atan(pos.z, pos.x);
              const disk = accretionDiskColor(
                mR,
                hitAngle,
                uniforms.time,
                rayDir,
              );
              const dens = vert.mul(disk.w).mul(float(0.35));
              const stepA = dens.min(float(0.25));
              const rem = float(1.0).sub(alpha);
              color.addAssign(disk.xyz.mul(stepA).mul(rem));
              alpha.addAssign(rem.mul(stepA));
            });
          });
        },
      );
    });

    // ── Shadow ─────────────────────────────────────────────────────────────
    const aaW = max(fwidth(minR).mul(1.5), rs.mul(0.012));
    const shadow = float(1.0)
      .sub(smoothstep(rs.sub(aaW), photonR.add(aaW), minR))
      .toVar("shadow");
    If(captured.greaterThan(0.5), () => {
      shadow.assign(1.0);
    });
    // Critical b that never escaped → black
    If(isCritical.greaterThan(0.5).and(escaped.lessThan(0.5)), () => {
      shadow.assign(float(1.0));
      captured.assign(1.0);
    });

    If(captured.lessThan(0.5), () => {
      escaped.assign(1.0);
    });

    const skyT = float(1.0).sub(shadow).mul(float(1.0).sub(alpha));
    const bg = vec3(0.0, 0.0, 0.0).toVar("bg");
    If(escaped.greaterThan(0.5).and(skyT.greaterThan(0.001)), () => {
      If(uniforms.starsEnabled.greaterThan(0.5), () => {
        bg.addAssign(starField(rayDir));
      });
      If(uniforms.nebulaEnabled.greaterThan(0.5), () => {
        bg.addAssign(nebulaField(rayDir));
      });
    });

    const safeA = max(alpha, float(1.0e-4));
    const straight = color.div(safeA);
    const toned = max(straight, vec3(0.0))
      .div(max(straight, vec3(0.0)).add(vec3(0.85)))
      .mul(1.12);

    const diskPm = toned.mul(alpha);
    const sky = bg.mul(skyT).mul(float(4.5));
    const rgb = diskPm.add(sky).toVar("rgb");
    const outA = max(alpha, shadow).toVar("outA");

    rgb.assign(
      mix(rgb, vec3(0.0, 0.0, 0.0), shadow.mul(float(1.0).sub(alpha))),
    );
    rgb.assign(clamp(rgb, float(0.0), float(1.08)));
    outA.assign(clamp(outA, float(0.0), float(1.0)));

    const luma = max(rgb.x, max(rgb.y, rgb.z));
    Discard(outA.lessThan(0.002).and(luma.lessThan(0.002)));

    return rgb.toVec4(outA);
  })();
}
