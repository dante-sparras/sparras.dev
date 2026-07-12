"use client";

/**
 * Inverted skydome + TSL uniform bag for the Schwarzschild raymarch.
 * Uniforms created once per mount; patched on config / camera / size change.
 *
 * Camera axes are taken from matrixWorld (not rebuilt with worldUp in the shader)
 * so looking nearly along ±Y never snaps the basis.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three/webgpu";
import { uniform } from "three/tsl";
import type { BlackHoleConfig } from "./config";
import { createBlackHoleShader } from "./shader";

// ── Uniform bag ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UniformNode = { value: any };

export type BlackHoleUniforms = {
  time: UniformNode;
  resolution: UniformNode;
  cameraPosition: UniformNode;
  /** World-space camera axes from matrixWorld (stable at poles). */
  cameraForward: UniformNode;
  cameraRight: UniformNode;
  cameraUp: UniformNode;
  /** Vertical FOV in degrees (matches PerspectiveCamera). */
  cameraFov: UniformNode;
} & Record<(typeof SCALARS)[number], UniformNode> &
  Record<(typeof BOOLS)[number], UniformNode> &
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
  "diskScaleHeight",
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

const COLOR4 = [
  "starTint",
  "diskTint",
  "nebula1Color",
  "nebula2Color",
] as const satisfies readonly (keyof BlackHoleConfig)[];

const tmp4 = new THREE.Vector4();
const tmpColor = new THREE.Color();

/**
 * CSS hex → display RGB (no sRGB→linear decode).
 * Shader + WebGPUCanvas use a display-referred path.
 */
function parseCssColor(hex: string): THREE.Color {
  const raw = hex.trim();
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
    cameraForward: uniform(new THREE.Vector3(0, 0, -1)),
    cameraRight: uniform(new THREE.Vector3(1, 0, 0)),
    cameraUp: uniform(new THREE.Vector3(0, 1, 0)),
    cameraFov: uniform(48),
  } as unknown as BlackHoleUniforms;

  for (const k of SCALARS) u[k] = uniform(config[k]);
  for (const k of BOOLS) u[k] = uniform(config[k] ? 1 : 0);
  for (const k of COLOR4) u[k] = uniform(hexToVec4(config[k]));
  return u;
}

function applyConfig(u: BlackHoleUniforms, config: BlackHoleConfig) {
  for (const k of SCALARS) u[k].value = config[k];
  for (const k of BOOLS) u[k].value = config[k] ? 1 : 0;
  for (const k of COLOR4) u[k].value.copy(hexToVec4(config[k], tmp4));
}

/** Scratch vectors for matrixWorld column extraction (no alloc per frame). */
type AxisScratch = {
  right: THREE.Vector3;
  up: THREE.Vector3;
  forward: THREE.Vector3;
};

/**
 * Sync camera uniforms from the real world matrix.
 * Avoids reconstructing a lookAt basis with worldUp (singular when looking ±Y).
 */
function syncCamera(
  u: BlackHoleUniforms,
  camera: THREE.Camera,
  axes: AxisScratch,
) {
  camera.updateMatrixWorld();
  const e = camera.matrixWorld.elements;

  // Three.js camera: +X right, +Y up, −Z forward (local)
  axes.right.set(e[0], e[1], e[2]).normalize();
  axes.up.set(e[4], e[5], e[6]).normalize();
  axes.forward.set(-e[8], -e[9], -e[10]).normalize();

  u.cameraPosition.value.copy(camera.position);
  u.cameraRight.value.copy(axes.right);
  u.cameraUp.value.copy(axes.up);
  u.cameraForward.value.copy(axes.forward);

  const fov = (camera as THREE.PerspectiveCamera).fov;
  if (typeof fov === "number" && Number.isFinite(fov)) {
    u.cameraFov.value = fov;
  }
}

// ── Mesh ────────────────────────────────────────────────────────────────────

const MAX_DT = 1 / 30;
const SCALE: [number, number, number] = [-1, 1, 1];
const GEO: [number, number, number] = [100, 64, 64];

export function BlackHoleMesh({ config }: { config: BlackHoleConfig }) {
  const { camera, size } = useThree();
  const axes = useRef<AxisScratch>({
    right: new THREE.Vector3(1, 0, 0),
    up: new THREE.Vector3(0, 1, 0),
    forward: new THREE.Vector3(0, 0, -1),
  });

  const uniforms = useRef<BlackHoleUniforms | null>(null);
  if (!uniforms.current) uniforms.current = createUniforms(config);
  const u = uniforms.current;

  const fragmentNode = useMemo(() => createBlackHoleShader(u), [u]);

  useLayoutEffect(() => {
    applyConfig(u, config);
  }, [config, u]);

  useLayoutEffect(() => {
    u.resolution.value.set(Math.max(1, size.width), Math.max(1, size.height));
  }, [size.width, size.height, u]);

  useFrame((_, delta) => {
    u.time.value += Math.min(delta, MAX_DT);
    syncCamera(u, camera, axes.current);
  });

  return (
    <mesh frustumCulled={false} scale={SCALE}>
      <sphereGeometry args={GEO} />
      {/*
        fragmentNode: full RGBA. Void pixels Discard'd so transparent clear
        shows CSS `bg-background`. Canvas is premultiplied when alpha:true.
      */}
      <meshBasicNodeMaterial
        fragmentNode={fragmentNode}
        transparent
        premultipliedAlpha
        depthWrite={false}
        depthTest={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}
