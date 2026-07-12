"use client";

/**
 * Inverted skydome + TSL uniform bag for the Schwarzschild raymarch.
 * Uniforms are created once per mount, then patched when config / camera / size change.
 */
import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three/webgpu";
import { uniform } from "three/tsl";
import type { BlackHoleConfig } from "./config";
import { createBlackHoleShader } from "./shader";

// ── Uniform bag ─────────────────────────────────────────────────────────────

/** TSL uniform node — patch `.value` each frame / on config change. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UniformNode = { value: any };

export type BlackHoleUniforms = {
  time: UniformNode;
  resolution: UniformNode;
  cameraPosition: UniformNode;
  cameraTarget: UniformNode;
} & Record<(typeof SCALARS)[number], UniformNode> &
  Record<(typeof BOOLS)[number], UniformNode> &
  Record<(typeof COLOR3)[number], UniformNode> &
  Record<(typeof COLOR4)[number], UniformNode>;

const SCALARS = [
  "blackHoleMass",
  "diskInnerRadius",
  "diskOuterRadius",
  "diskTemperature",
  "temperatureFalloff",
  "diskBrightness",
  "diskRotationSpeed",
  "turbulenceScale",
  "turbulenceStretch",
  "turbulenceSharpness",
  "turbulenceCycleTime",
  "turbulenceLacunarity",
  "turbulencePersistence",
  "diskEdgeSoftnessInner",
  "diskEdgeSoftnessOuter",
  "gravitationalLensing",
  "dopplerStrength",
  "stepSize",
  "starDensity",
  "starSize",
  "starBrightness",
  "diskSaturation",
  "diskInkMode",
  "nebula1Scale",
  "nebula1Density",
  "nebula2Scale",
  "nebula2Density",
] as const satisfies readonly (keyof BlackHoleConfig)[];

const BOOLS = [
  "starsEnabled",
  "nebulaEnabled",
] as const satisfies readonly (keyof BlackHoleConfig)[];

const COLOR3 = [
  "starBackgroundColor",
] as const satisfies readonly (keyof BlackHoleConfig)[];

const COLOR4 = [
  "starTint",
  "diskTint",
  "nebula1Color",
  "nebula2Color",
] as const satisfies readonly (keyof BlackHoleConfig)[];

const tmp3 = new THREE.Vector3();
const tmp4 = new THREE.Vector4();
const tmpColor = new THREE.Color();

/**
 * CSS hex → RGB as *display* values (no sRGB→linear decode).
 *
 * The black-hole shader + WebGPUCanvas use a display-referred path
 * (manual γ on disk, LinearSRGB framebuffer). Default THREE.Color.set(hex)
 * would store ~0.0015 for #050505 and the canvas would read as near-black.
 */
function parseCssColor(hex: string): THREE.Color {
  const raw = hex.trim();
  // Prefer explicit channels so unknown CSS never leaves a stale Color.
  if (/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(raw) || /^rgba?\(/i.test(raw)) {
    tmpColor.setStyle(
      raw.length === 9 && raw.startsWith("#") ? raw.slice(0, 7) : raw,
      THREE.LinearSRGBColorSpace,
    );
  } else {
    tmpColor.setRGB(5 / 255, 5 / 255, 5 / 255, THREE.LinearSRGBColorSpace);
  }
  return tmpColor;
}

function hexToVec3(hex: string, out = new THREE.Vector3()) {
  const c = parseCssColor(hex);
  return out.set(c.r, c.g, c.b);
}

function hexToVec4(hex: string, out = new THREE.Vector4()) {
  const h = hex.trim().replace(/^#/, "");
  if (h.length === 8 && /^[0-9a-fA-F]+$/.test(h)) {
    parseCssColor(`#${h.slice(0, 6)}`);
    return out.set(
      tmpColor.r,
      tmpColor.g,
      tmpColor.b,
      parseInt(h.slice(6, 8), 16) / 255,
    );
  }
  parseCssColor(hex.startsWith("#") ? hex : hex.trim());
  return out.set(tmpColor.r, tmpColor.g, tmpColor.b, 1);
}

function createUniforms(config: BlackHoleConfig): BlackHoleUniforms {
  const u = {
    time: uniform(0),
    resolution: uniform(new THREE.Vector2(1, 1)),
    cameraPosition: uniform(new THREE.Vector3()),
    cameraTarget: uniform(new THREE.Vector3()),
  } as unknown as BlackHoleUniforms;

  for (const k of SCALARS) u[k] = uniform(config[k]);
  for (const k of BOOLS) u[k] = uniform(config[k] ? 1 : 0);
  for (const k of COLOR3) u[k] = uniform(hexToVec3(config[k]));
  for (const k of COLOR4) u[k] = uniform(hexToVec4(config[k]));
  return u;
}

function applyConfig(u: BlackHoleUniforms, config: BlackHoleConfig) {
  for (const k of SCALARS) u[k].value = config[k];
  for (const k of BOOLS) u[k].value = config[k] ? 1 : 0;
  for (const k of COLOR3) u[k].value.copy(hexToVec3(config[k], tmp3));
  for (const k of COLOR4) u[k].value.copy(hexToVec4(config[k], tmp4));
}

function syncCamera(
  u: BlackHoleUniforms,
  camera: THREE.Camera,
  lookDir: THREE.Vector3,
) {
  u.cameraPosition.value.copy(camera.position);
  lookDir.set(0, 0, -1).applyQuaternion(camera.quaternion);
  u.cameraTarget.value.copy(camera.position).addScaledVector(lookDir, 10);
}

// ── Mesh ────────────────────────────────────────────────────────────────────

const MAX_DT = 1 / 30;
const SCALE: [number, number, number] = [-1, 1, 1];
const GEO: [number, number, number] = [100, 64, 64];

export function BlackHoleMesh({ config }: { config: BlackHoleConfig }) {
  const { camera, size } = useThree();
  const lookDir = useRef(new THREE.Vector3());

  // Create once — config is applied in layout effects below.
  const uniforms = useRef<BlackHoleUniforms | null>(null);
  if (!uniforms.current) uniforms.current = createUniforms(config);
  const u = uniforms.current;

  const colorNode = useMemo(() => createBlackHoleShader(u), [u]);

  useLayoutEffect(() => {
    applyConfig(u, config);
  }, [config, u]);

  useLayoutEffect(() => {
    u.resolution.value.set(Math.max(1, size.width), Math.max(1, size.height));
  }, [size.width, size.height, u]);

  useFrame((_, delta) => {
    u.time.value += Math.min(delta, MAX_DT);
    syncCamera(u, camera, lookDir.current);
  });

  return (
    <mesh frustumCulled={false} scale={SCALE}>
      <sphereGeometry args={GEO} />
      <meshBasicNodeMaterial
        colorNode={colorNode}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
