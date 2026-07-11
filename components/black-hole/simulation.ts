/**
 * Schwarzschild black hole simulation (Three.js WebGPU + TSL).
 * Port of dgreenheck/webgpu-black-hole — see ./shader.ts for raymarch.
 */
import * as THREE from "three/webgpu";
import { uniform } from "three/tsl";
import { parseHexRgba } from "@/lib/utils";
import { createBlackHoleShader } from "./shader";
import type {
  BlackHoleConfig,
  BlackHoleConfigPatch,
  BlackHoleUniforms,
} from "./types";

function hexToVec3(hex: string): THREE.Vector3 {
  const { r, g, b } = parseHexRgba(hex);
  return new THREE.Vector3(r, g, b);
}

function hexToVec4(hex: string): THREE.Vector4 {
  const { r, g, b, a } = parseHexRgba(hex);
  return new THREE.Vector4(r, g, b, a);
}

const SCALAR_KEYS = [
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
  "bloomStrength",
  "bloomThreshold",
  "nebula1Scale",
  "nebula1Density",
  "nebula2Scale",
  "nebula2Density",
] as const;

const BOOL_KEYS = ["starsEnabled", "nebulaEnabled"] as const;
const COLOR3_KEYS = ["starBackgroundColor"] as const;
const COLOR4_KEYS = [
  "starTint",
  "diskTint",
  "nebula1Color",
  "nebula2Color",
] as const;

export class BlackHoleSimulation {
  scene: THREE.Scene;
  config: BlackHoleConfig;
  blackHoleMesh: THREE.Mesh | null = null;
  uniforms: BlackHoleUniforms;

  constructor(scene: THREE.Scene, config: BlackHoleConfig) {
    this.scene = scene;
    this.config = config;
    this.uniforms = this.#buildUniforms(config);
  }

  #buildUniforms(c: BlackHoleConfig): BlackHoleUniforms {
    return {
      blackHoleMass: uniform(c.blackHoleMass),
      diskInnerRadius: uniform(c.diskInnerRadius),
      diskOuterRadius: uniform(c.diskOuterRadius),
      diskTemperature: uniform(c.diskTemperature),
      temperatureFalloff: uniform(c.temperatureFalloff),
      diskBrightness: uniform(c.diskBrightness),
      diskRotationSpeed: uniform(c.diskRotationSpeed),
      turbulenceScale: uniform(c.turbulenceScale),
      turbulenceStretch: uniform(c.turbulenceStretch),
      turbulenceSharpness: uniform(c.turbulenceSharpness),
      turbulenceCycleTime: uniform(c.turbulenceCycleTime),
      turbulenceLacunarity: uniform(c.turbulenceLacunarity),
      turbulencePersistence: uniform(c.turbulencePersistence),
      diskEdgeSoftnessInner: uniform(c.diskEdgeSoftnessInner),
      diskEdgeSoftnessOuter: uniform(c.diskEdgeSoftnessOuter),
      gravitationalLensing: uniform(c.gravitationalLensing),
      dopplerStrength: uniform(c.dopplerStrength),
      stepSize: uniform(c.stepSize),

      starsEnabled: uniform(c.starsEnabled ? 1.0 : 0.0),
      starBackgroundColor: uniform(hexToVec3(c.starBackgroundColor)),
      starDensity: uniform(c.starDensity),
      starSize: uniform(c.starSize),
      starBrightness: uniform(c.starBrightness),
      starTint: uniform(hexToVec4(c.starTint)),

      diskSaturation: uniform(c.diskSaturation),
      diskTint: uniform(hexToVec4(c.diskTint)),
      diskInkMode: uniform(c.diskInkMode),

      bloomStrength: uniform(c.bloomStrength),
      bloomThreshold: uniform(c.bloomThreshold),

      nebulaEnabled: uniform(c.nebulaEnabled ? 1.0 : 0.0),
      nebula1Scale: uniform(c.nebula1Scale),
      nebula1Density: uniform(c.nebula1Density),
      nebula1Color: uniform(hexToVec4(c.nebula1Color)),
      nebula2Scale: uniform(c.nebula2Scale),
      nebula2Density: uniform(c.nebula2Density),
      nebula2Color: uniform(hexToVec4(c.nebula2Color)),

      time: uniform(0),
      resolution: uniform(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
      ),
      cameraPosition: uniform(new THREE.Vector3(0, 5, 20)),
      cameraTarget: uniform(new THREE.Vector3(0, 0, 0)),
    };
  }

  createBlackHole(): void {
    if (this.blackHoleMesh) {
      this.scene.remove(this.blackHoleMesh);
      const prevMat = this.blackHoleMesh.material;
      if (prevMat && !Array.isArray(prevMat)) prevMat.dispose();
      this.blackHoleMesh.geometry?.dispose();
    }

    const geometry = new THREE.SphereGeometry(100, 32, 32);
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshBasicNodeMaterial();
    material.colorNode = createBlackHoleShader(this.uniforms);

    this.blackHoleMesh = new THREE.Mesh(geometry, material);
    this.blackHoleMesh.frustumCulled = false;
    this.scene.add(this.blackHoleMesh);
  }

  updateUniforms(patch: BlackHoleConfigPatch): void {
    const u = this.uniforms;

    for (const key of SCALAR_KEYS) {
      const v = patch[key];
      if (v !== undefined) u[key].value = v;
    }
    for (const key of BOOL_KEYS) {
      const v = patch[key];
      if (v !== undefined) u[key].value = v ? 1.0 : 0.0;
    }
    for (const key of COLOR3_KEYS) {
      const v = patch[key];
      if (v !== undefined) u[key].value.copy(hexToVec3(v));
    }
    for (const key of COLOR4_KEYS) {
      const v = patch[key];
      if (v !== undefined) u[key].value.copy(hexToVec4(v));
    }
  }

  updateCamera(camera: THREE.Camera): void {
    this.uniforms.cameraPosition.value.copy(camera.position);
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(
      camera.quaternion,
    );
    this.uniforms.cameraTarget.value
      .copy(camera.position)
      .add(direction.multiplyScalar(10));
  }

  update(deltaTime: number, camera: THREE.Camera): void {
    this.uniforms.time.value += deltaTime;
    this.updateCamera(camera);
  }

  onResize(width: number, height: number): void {
    this.uniforms.resolution.value.set(width, height);
  }

  dispose(): void {
    if (!this.blackHoleMesh) return;
    this.scene.remove(this.blackHoleMesh);
    this.blackHoleMesh.geometry?.dispose();
    const mat = this.blackHoleMesh.material;
    if (mat && !Array.isArray(mat)) mat.dispose();
    this.blackHoleMesh = null;
  }
}
