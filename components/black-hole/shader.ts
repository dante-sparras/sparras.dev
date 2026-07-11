// @ts-nocheck
// Three.js TSL Fn() callbacks are not accurately typed (NodeBuilder iterable errors).
// Runtime behavior is unchanged; simulation.ts / theme / defaults are fully typed.

/**
 * Raymarching shader for black hole visualization using Three.js TSL.
 */

import type { BlackHoleUniforms } from "./types";
import {
  vec2,
  vec3,
  vec4,
  float,
  Fn,
  length,
  normalize,
  cross,
  dot,
  sin,
  cos,
  atan,
  asin,
  sqrt,
  pow,
  exp,
  fract,
  clamp,
  max,
  min,
  smoothstep,
  mix,
  floor,
  step,
  sign,
  Loop,
  Break,
  If,
  screenUV,
  fwidth,
} from "three/tsl";

// Hash functions for pseudo-random number generation
const hash21 = Fn(([p]) => {
  const n = sin(dot(p, vec2(127.1, 311.7))).mul(43758.5453);
  return fract(n);
});

const hash31 = Fn(([p]) => {
  const n = sin(dot(p, vec3(127.1, 311.7, 74.7))).mul(43758.5453);
  return fract(n);
});

const hash22 = Fn(([p]) => {
  const px = fract(sin(dot(p, vec2(127.1, 311.7))).mul(43758.5453));
  const py = fract(sin(dot(p, vec2(269.5, 183.3))).mul(43758.5453));
  return vec2(px, py);
});

// 3D value noise
const noise3D = Fn(([p]) => {
  const i = floor(p);
  const f = fract(p);
  const u = f.mul(f).mul(float(3.0).sub(f.mul(2.0)));

  const a = hash31(i);
  const b = hash31(i.add(vec3(1, 0, 0)));
  const c = hash31(i.add(vec3(0, 1, 0)));
  const d = hash31(i.add(vec3(1, 1, 0)));
  const e = hash31(i.add(vec3(0, 0, 1)));
  const f2 = hash31(i.add(vec3(1, 0, 1)));
  const g = hash31(i.add(vec3(0, 1, 1)));
  const h = hash31(i.add(vec3(1, 1, 1)));

  return mix(
    mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
    mix(mix(e, f2, u.x), mix(g, h, u.x), u.y),
    u.z,
  );
});

// Fractal Brownian Motion - 4 octaves of layered noise
const fbm = Fn(([p, lacunarity, persistence]) => {
  const value = float(0.0).toVar();
  const amplitude = float(0.5).toVar();
  const pos = p.toVar();

  value.addAssign(noise3D(pos).mul(amplitude));
  pos.mulAssign(lacunarity);
  amplitude.mulAssign(persistence);

  value.addAssign(noise3D(pos).mul(amplitude));
  pos.mulAssign(lacunarity);
  amplitude.mulAssign(persistence);

  value.addAssign(noise3D(pos).mul(amplitude));
  pos.mulAssign(lacunarity);
  amplitude.mulAssign(persistence);

  value.addAssign(noise3D(pos).mul(amplitude));

  return value;
});

// Mitchell Charity Blackbody Colors (CIE 1931 2-deg, sRGB)
// Source: http://www.vendian.org/mncharity/dir3/blackbody/
// Temperature range: 1000K - 40000K (100K steps for 1000-10000K, 1000K steps above)
const BLACKBODY_COLORS: Record<number, [number, number, number]> = {
  1000: [1, 0.0337, 0],
  1100: [1, 0.0592, 0],
  1200: [1, 0.0846, 0],
  1300: [1, 0.1096, 0],
  1400: [1, 0.1341, 0],
  1500: [1, 0.1578, 0],
  1600: [1, 0.1806, 0],
  1700: [1, 0.2025, 0],
  1800: [1, 0.2235, 0],
  1900: [1, 0.2434, 0],
  2000: [1, 0.2647, 0.0033],
  2100: [1, 0.2889, 0.012],
  2200: [1, 0.3126, 0.0219],
  2300: [1, 0.336, 0.0331],
  2400: [1, 0.3589, 0.0454],
  2500: [1, 0.3814, 0.0588],
  2600: [1, 0.4034, 0.0734],
  2700: [1, 0.425, 0.0889],
  2800: [1, 0.4461, 0.1054],
  2900: [1, 0.4668, 0.1229],
  3000: [1, 0.487, 0.1411],
  3100: [1, 0.5067, 0.1602],
  3200: [1, 0.5259, 0.18],
  3300: [1, 0.5447, 0.2005],
  3400: [1, 0.563, 0.2216],
  3500: [1, 0.5809, 0.2433],
  3600: [1, 0.5983, 0.2655],
  3700: [1, 0.6153, 0.2881],
  3800: [1, 0.6318, 0.3112],
  3900: [1, 0.648, 0.3346],
  4000: [1, 0.6636, 0.3583],
  4100: [1, 0.6789, 0.3823],
  4200: [1, 0.6938, 0.4066],
  4300: [1, 0.7083, 0.431],
  4400: [1, 0.7223, 0.4556],
  4500: [1, 0.736, 0.4803],
  4600: [1, 0.7494, 0.5051],
  4700: [1, 0.7623, 0.5299],
  4800: [1, 0.775, 0.5548],
  4900: [1, 0.7872, 0.5797],
  5000: [1, 0.7992, 0.6045],
  5100: [1, 0.8108, 0.6293],
  5200: [1, 0.8221, 0.6541],
  5300: [1, 0.833, 0.6787],
  5400: [1, 0.8437, 0.7032],
  5500: [1, 0.8541, 0.7277],
  5600: [1, 0.8642, 0.7519],
  5700: [1, 0.874, 0.776],
  5800: [1, 0.8836, 0.8],
  5900: [1, 0.8929, 0.8238],
  6000: [1, 0.9019, 0.8473],
  6100: [1, 0.9107, 0.8707],
  6200: [1, 0.9193, 0.8939],
  6300: [1, 0.9276, 0.9168],
  6400: [1, 0.9357, 0.9396],
  6500: [1, 0.9436, 0.9621],
  6600: [1, 0.9513, 0.9844],
  6700: [0.9937, 0.9526, 1],
  6800: [0.9726, 0.9395, 1],
  6900: [0.9526, 0.927, 1],
  7000: [0.9337, 0.915, 1],
  7100: [0.9157, 0.9035, 1],
  7200: [0.8986, 0.8925, 1],
  7300: [0.8823, 0.8819, 1],
  7400: [0.8668, 0.8718, 1],
  7500: [0.852, 0.8621, 1],
  7600: [0.8379, 0.8527, 1],
  7700: [0.8244, 0.8437, 1],
  7800: [0.8115, 0.8351, 1],
  7900: [0.7992, 0.8268, 1],
  8000: [0.7874, 0.8187, 1],
  8100: [0.7761, 0.811, 1],
  8200: [0.7652, 0.8035, 1],
  8300: [0.7548, 0.7963, 1],
  8400: [0.7449, 0.7894, 1],
  8500: [0.7353, 0.7827, 1],
  8600: [0.726, 0.7762, 1],
  8700: [0.7172, 0.7699, 1],
  8800: [0.7086, 0.7638, 1],
  8900: [0.7004, 0.7579, 1],
  9000: [0.6925, 0.7522, 1],
  9100: [0.6848, 0.7467, 1],
  9200: [0.6774, 0.7414, 1],
  9300: [0.6703, 0.7362, 1],
  9400: [0.6635, 0.7311, 1],
  9500: [0.6568, 0.7263, 1],
  9600: [0.6504, 0.7215, 1],
  9700: [0.6442, 0.7169, 1],
  9800: [0.6382, 0.7124, 1],
  9900: [0.6324, 0.7081, 1],
  10000: [0.6268, 0.7039, 1],
  11000: [0.5791, 0.6674, 1],
  12000: [0.5431, 0.6389, 1],
  13000: [0.5152, 0.6162, 1],
  14000: [0.493, 0.5978, 1],
  15000: [0.4749, 0.5824, 1],
  16000: [0.4599, 0.5696, 1],
  17000: [0.4474, 0.5586, 1],
  18000: [0.4367, 0.5492, 1],
  19000: [0.4275, 0.541, 1],
  20000: [0.4196, 0.5339, 1],
  25000: [0.3917, 0.5083, 1],
  30000: [0.3751, 0.4926, 1],
  35000: [0.3641, 0.4821, 1],
  40000: [0.3563, 0.4745, 1],
};

// Helper to interpolate blackbody colors
function getBlackbodyColor(tempK: number): [number, number, number] {
  const temps = Object.keys(BLACKBODY_COLORS)
    .map(Number)
    .toSorted((a, b) => a - b);
  const clampedTemp = Math.max(1000, Math.min(40000, tempK));

  let lowTemp = temps[0],
    highTemp = temps[0];
  for (let i = 0; i < temps.length - 1; i++) {
    if (clampedTemp >= temps[i] && clampedTemp <= temps[i + 1]) {
      lowTemp = temps[i];
      highTemp = temps[i + 1];
      break;
    }
  }

  const t =
    highTemp === lowTemp ? 0 : (clampedTemp - lowTemp) / (highTemp - lowTemp);
  const cLow = BLACKBODY_COLORS[lowTemp];
  const cHigh = BLACKBODY_COLORS[highTemp];

  return [
    cLow[0] + (cHigh[0] - cLow[0]) * t,
    cLow[1] + (cHigh[1] - cLow[1]) * t,
    cLow[2] + (cHigh[2] - cLow[2]) * t,
  ];
}

// Pre-build arrays for shader lookup (100K steps from 1000K-10000K, then 1000K steps to 40000K)
const BLACKBODY_TEMPS: number[] = [];
const BLACKBODY_R: number[] = [];
const BLACKBODY_G: number[] = [];
const BLACKBODY_B: number[] = [];
for (let t = 1000; t <= 10000; t += 100) {
  BLACKBODY_TEMPS.push(t);
  const c = getBlackbodyColor(t);
  BLACKBODY_R.push(c[0]);
  BLACKBODY_G.push(c[1]);
  BLACKBODY_B.push(c[2]);
}
for (let t = 11000; t <= 40000; t += 1000) {
  BLACKBODY_TEMPS.push(t);
  const c = getBlackbodyColor(t);
  BLACKBODY_R.push(c[0]);
  BLACKBODY_G.push(c[1]);
  BLACKBODY_B.push(c[2]);
}

// Convert temperature to RGB using lookup table with linear interpolation
const blackbodyColor = Fn(([tempK]) => {
  const temp = clamp(tempK, float(1000.0), float(40000.0));

  const r = float(0.0).toVar();
  const g = float(0.0).toVar();
  const b = float(0.0).toVar();

  // Search through temperature breakpoints and interpolate
  for (let i = 0; i < BLACKBODY_TEMPS.length - 1; i++) {
    const tLow = float(BLACKBODY_TEMPS[i]);
    const tHigh = float(BLACKBODY_TEMPS[i + 1]);

    const inRange = step(tLow, temp).mul(step(temp, tHigh));
    const t = temp.sub(tLow).div(tHigh.sub(tLow));

    r.addAssign(
      mix(float(BLACKBODY_R[i]), float(BLACKBODY_R[i + 1]), t).mul(inRange),
    );
    g.addAssign(
      mix(float(BLACKBODY_G[i]), float(BLACKBODY_G[i + 1]), t).mul(inRange),
    );
    b.addAssign(
      mix(float(BLACKBODY_B[i]), float(BLACKBODY_B[i + 1]), t).mul(inRange),
    );
  }

  return vec3(r, g, b);
});

// Procedural star field — 3×3 cell neighborhood + soft kernels
// (single-cell sampling + hard tips caused many stars to flicker while moving)
const createStarField = (uniforms: BlackHoleUniforms) =>
  Fn(([rayDir]) => {
    const theta = atan(rayDir.z, rayDir.x);
    const phi = asin(clamp(rayDir.y, float(-1.0), float(1.0)));

    const gridScale = float(55.0).div(max(uniforms.starSize, float(0.35)));
    const scaledCoord = vec2(theta, phi).mul(gridScale);
    const baseCell = floor(scaledCoord);

    const acc = vec3(0.0, 0.0, 0.0).toVar("starAcc");

    // Unrolled 3×3 so stars near cell edges stay continuous across frames
    for (const ox of [-1, 0, 1]) {
      for (const oy of [-1, 0, 1]) {
        const cell = baseCell.add(vec2(ox, oy));
        // Local UV relative to this cell (not fract — correct for neighbors)
        const cellUV = scaledCoord.sub(cell);

        const cellHash = hash21(cell);
        const starProb = step(float(1.0).sub(uniforms.starDensity), cellHash);

        const starPos = hash22(cell.add(42.0)).mul(0.75).add(0.125);
        const distToStar = length(cellUV.sub(starPos));

        // Slightly larger + Gaussian falloff = less temporal aliasing
        const baseSizeVar = hash21(cell.add(100.0)).mul(0.028).add(0.014);
        const finalStarSize = baseSizeVar
          .mul(uniforms.starSize)
          .mul(1.2)
          .max(0.002);
        const d = distToStar.div(finalStarSize);
        const starCore = exp(d.mul(d).negate().mul(2.8));
        const starGlow = exp(d.mul(d).negate().mul(0.5)).mul(0.25);
        const starIntensity = starCore.add(starGlow).mul(starProb);

        const colorTemp = hash21(cell.add(200.0));
        const starColor = mix(
          vec3(0.92, 0.94, 1.0),
          vec3(1.0, 0.97, 0.92),
          colorTemp,
        )
          .mul(uniforms.starTint.xyz)
          .mul(uniforms.starTint.w);

        acc.addAssign(
          starColor.mul(starIntensity).mul(uniforms.starBrightness),
        );
      }
    }

    return acc;
  });

// Procedural nebula clouds - two FBM layers
const createNebulaField = (uniforms: BlackHoleUniforms) =>
  Fn(([rayDir]) => {
    const noisePos1 = rayDir.mul(uniforms.nebula1Scale);
    const n1 = fbm(noisePos1, float(2.0), float(0.5)).mul(2.0).sub(1.0);
    const layer1 = clamp(
      n1.add(uniforms.nebula1Density),
      float(0.0),
      float(1.0),
    );
    // True color × alpha × density (supports #rrggbbaa e.g. border #ffffff1a)
    const color1 = uniforms.nebula1Color.xyz
      .mul(uniforms.nebula1Color.w)
      .mul(layer1);

    const noisePos2 = rayDir.mul(uniforms.nebula2Scale);
    const n2 = fbm(noisePos2, float(2.0), float(0.5)).mul(2.0).sub(1.0);
    const layer2 = clamp(
      n2.add(uniforms.nebula2Density),
      float(0.0),
      float(1.0),
    );
    const color2 = uniforms.nebula2Color.xyz
      .mul(uniforms.nebula2Color.w)
      .mul(layer2);

    return color1.add(color2);
  });

// Accretion disk color with blackbody temperature, Doppler beaming, and turbulence
const createAccretionDiskColor = (uniforms: BlackHoleUniforms) =>
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

    const voidCol = uniforms.starBackgroundColor;
    const finalColor = mix(voidCol, contentTone, cover).toVar("finalColor");

    If(uniforms.nebulaEnabled.greaterThan(0.5), () => {
      finalColor.addAssign(nebCol.mul(float(1.0).sub(alpha)).mul(skyOk));
    });

    If(uniforms.starsEnabled.greaterThan(0.5), () => {
      const starsLit = pow(max(starsCol, vec3(0.0)), vec3(1.0 / 2.2)).mul(3.0);
      finalColor.addAssign(starsLit.mul(float(1.0).sub(alpha)).mul(skyOk));
    });
    finalColor.assign(clamp(finalColor, float(0.0), float(1.12)));

    return vec4(finalColor, 1.0);
  })();
}
