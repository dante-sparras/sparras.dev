/**
 * CPU → GPU uniforms for the black-hole raymarch.
 */

import { uniform } from "three/tsl";
import * as THREE from "three/webgpu";
import { CAMERA, type BlackHoleConfig } from "./physics";
import {
  CONFIG_SCALAR_KEYS,
  type BlackHoleUniforms,
  type UniformNode,
} from "./shader/types";

/** Brand a TSL uniform as our UniformNode without `any`. */
function asUniform<T>(node: { value: T }): UniformNode<T> {
  return node as unknown as UniformNode<T>;
}

export type CameraAxes = {
  right: THREE.Vector3;
  up: THREE.Vector3;
  forward: THREE.Vector3;
};

export function createCameraAxes(): CameraAxes {
  return {
    right: new THREE.Vector3(),
    up: new THREE.Vector3(),
    forward: new THREE.Vector3(),
  };
}

/**
 * Allocate GPU uniforms from a resolved config.
 * Call {@link applyConfig} when knobs change; {@link syncCamera} every frame.
 */
export function createUniforms(config: BlackHoleConfig): BlackHoleUniforms {
  const scalars = Object.fromEntries(
    CONFIG_SCALAR_KEYS.map((key) => [key, asUniform(uniform(config[key]))]),
  ) as Pick<BlackHoleUniforms, (typeof CONFIG_SCALAR_KEYS)[number]>;

  return {
    ...scalars,
    time: asUniform(uniform(0)),
    resolution: asUniform(uniform(new THREE.Vector2(1, 1))),
    cameraPosition: asUniform(uniform(new THREE.Vector3())),
    cameraRight: asUniform(uniform(new THREE.Vector3(1, 0, 0))),
    cameraUp: asUniform(uniform(new THREE.Vector3(0, 1, 0))),
    cameraForward: asUniform(uniform(new THREE.Vector3(0, 0, -1))),
    cameraFov: asUniform(uniform(CAMERA.fovDeg)),
  };
}

/** Copy all config scalars into existing uniforms (no realloc). */
export function applyConfig(
  uniforms: BlackHoleUniforms,
  config: BlackHoleConfig,
): void {
  for (const key of CONFIG_SCALAR_KEYS) {
    uniforms[key].value = config[key];
  }
}

/**
 * Write camera world basis into uniforms for the fragment ray basis.
 * `forward` points from camera toward the look-at (origin).
 */
export function syncCamera(
  uniforms: BlackHoleUniforms,
  camera: THREE.Camera,
  axes: CameraAxes,
): void {
  camera.getWorldPosition(uniforms.cameraPosition.value);
  camera.getWorldDirection(axes.forward);
  axes.right.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
  axes.up.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
  uniforms.cameraRight.value.copy(axes.right);
  uniforms.cameraUp.value.copy(axes.up);
  uniforms.cameraForward.value.copy(axes.forward);
}
