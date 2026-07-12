"use client";

/**
 * GPU uniform bag helpers for the black-hole mesh.
 * Pure host plumbing (no React) — imported only from client modules.
 */

import * as THREE from "three/webgpu";
import { uniform } from "three/tsl";
import { CAMERA_FOV_DEG, type BlackHoleConfig } from "./config";
import { CONFIG_SCALAR_KEYS, type BlackHoleUniforms } from "./shader";

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

/** Create the uniform bag once; scalar fields start from `config`. */
export function createUniforms(config: BlackHoleConfig): BlackHoleUniforms {
  const uniforms = {
    time: uniform(0),
    resolution: uniform(new THREE.Vector2(1, 1)),
    cameraPosition: uniform(new THREE.Vector3()),
    cameraForward: uniform(new THREE.Vector3(0, 0, -1)),
    cameraRight: uniform(new THREE.Vector3(1, 0, 0)),
    cameraUp: uniform(new THREE.Vector3(0, 1, 0)),
    cameraFov: uniform(CAMERA_FOV_DEG),
  } as unknown as BlackHoleUniforms;

  for (const key of CONFIG_SCALAR_KEYS) {
    uniforms[key] = uniform(config[key]) as BlackHoleUniforms[typeof key];
  }
  return uniforms;
}

/** Push every physics/render scalar from config into live uniforms. */
export function applyConfig(
  uniforms: BlackHoleUniforms,
  config: BlackHoleConfig,
) {
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
) {
  camera.updateMatrixWorld();
  const e = camera.matrixWorld.elements;

  axes.right.set(e[0], e[1], e[2]).normalize();
  axes.up.set(e[4], e[5], e[6]).normalize();
  axes.forward.set(-e[8], -e[9], -e[10]).normalize();

  uniforms.cameraPosition.value.copy(camera.position);
  uniforms.cameraRight.value.copy(axes.right);
  uniforms.cameraUp.value.copy(axes.up);
  uniforms.cameraForward.value.copy(axes.forward);

  const fov = (camera as THREE.PerspectiveCamera).fov;
  if (typeof fov === "number" && Number.isFinite(fov)) {
    uniforms.cameraFov.value = fov;
  }
}
