"use client";

/**
 * GPU uniform bag helpers for the black-hole mesh.
 * Host adapter (no React components) — imported only from client modules.
 */

import * as THREE from "three/webgpu";
import { uniform } from "three/tsl";
import { CAMERA_FOV_DEG, type BlackHoleConfig } from "./config";
import {
  CONFIG_SCALAR_KEYS,
  type BlackHoleUniforms,
  type UniformNode,
} from "./shader";

/** Scratch space for camera basis vectors (avoid alloc each frame). */
export type CameraAxes = {
  right: THREE.Vector3;
  up: THREE.Vector3;
  forward: THREE.Vector3;
};

export function createCameraAxes(): CameraAxes {
  return {
    right: new THREE.Vector3(1, 0, 0),
    up: new THREE.Vector3(0, 1, 0),
    forward: new THREE.Vector3(0, 0, -1),
  };
}

/** Narrow TSL `uniform()` result to our bag entry shape (structural). */
function asUniform<T>(node: { value: T }): UniformNode<T> {
  return node;
}

/** Create the uniform bag once; scalar fields start from `config`. */
export function createUniforms(config: BlackHoleConfig): BlackHoleUniforms {
  const scalars = {} as {
    [K in (typeof CONFIG_SCALAR_KEYS)[number]]: UniformNode<number>;
  };
  for (const key of CONFIG_SCALAR_KEYS) {
    scalars[key] = asUniform(uniform(config[key]));
  }

  return {
    time: asUniform(uniform(0)),
    resolution: asUniform(uniform(new THREE.Vector2(1, 1))),
    cameraPosition: asUniform(uniform(new THREE.Vector3())),
    cameraForward: asUniform(uniform(new THREE.Vector3(0, 0, -1))),
    cameraRight: asUniform(uniform(new THREE.Vector3(1, 0, 0))),
    cameraUp: asUniform(uniform(new THREE.Vector3(0, 1, 0))),
    cameraFov: asUniform(uniform(CAMERA_FOV_DEG)),
    ...scalars,
  };
}

/** Push every physics/render scalar from config into live uniforms. */
export function applyConfig(
  uniforms: BlackHoleUniforms,
  config: BlackHoleConfig,
): void {
  for (const key of CONFIG_SCALAR_KEYS) {
    uniforms[key].value = config[key];
  }
}

/**
 * Copy world camera pose into uniforms so the shader can build rays.
 * Three.js cameras look down local −Z; we store that as `cameraForward`.
 */
export function syncCamera(
  uniforms: BlackHoleUniforms,
  camera: THREE.Camera,
  axes: CameraAxes,
): void {
  camera.updateMatrixWorld();
  const e = camera.matrixWorld.elements;

  axes.right.set(e[0], e[1], e[2]).normalize();
  axes.up.set(e[4], e[5], e[6]).normalize();
  axes.forward.set(-e[8], -e[9], -e[10]).normalize();

  uniforms.cameraPosition.value.copy(camera.position);
  uniforms.cameraRight.value.copy(axes.right);
  uniforms.cameraUp.value.copy(axes.up);
  uniforms.cameraForward.value.copy(axes.forward);

  if (camera instanceof THREE.PerspectiveCamera) {
    const { fov } = camera;
    if (Number.isFinite(fov)) {
      uniforms.cameraFov.value = fov;
    }
  }
}
