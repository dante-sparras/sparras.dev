"use client";

/**
 * Camera helpers for WebGPU scenes.
 * - CameraLookAt — aim once at a world point (R3F position alone does not lookAt).
 * - IdleOrbit — OrbitControls + idle auto-rotate (respects prefers-reduced-motion).
 *
 * Polar clamps default slightly off the poles so OrbitControls never flips
 * azimuth when dragging over the top/bottom (classic spherical snap).
 */

import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const ORIGIN: [number, number, number] = [0, 0, 0];
const REDUCE_MOTION = "(prefers-reduced-motion: reduce)";

/** ~6° from pure pole — still looks face-on, no azimuth flip over the pole. */
const POLE_EPS = 0.1;

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCE_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCE_MOTION).matches,
    () => false,
  );
}

/** Point the active camera at a world-space target (default: origin). */
export function CameraLookAt({
  target = ORIGIN,
}: {
  target?: [number, number, number];
}) {
  const { camera } = useThree();

  useLayoutEffect(() => {
    camera.lookAt(target[0], target[1], target[2]);
    camera.updateMatrixWorld();
  }, [camera, target]);

  return null;
}

export type IdleOrbitProps = {
  interactive?: boolean;
  autoRotate?: boolean;
  /** Resume spin after user interaction (ms). */
  idleMs?: number;
  minDistance?: number;
  maxDistance?: number;
  rotateSpeed?: number;
  autoRotateSpeed?: number;
  target?: [number, number, number];
  /**
   * Polar angle clamps (radians from +Y). Defaults keep a small gap from the
   * poles so OrbitControls cannot snap azimuth when dragging over the top.
   */
  minPolarAngle?: number;
  maxPolarAngle?: number;
};

/** OrbitControls with optional idle auto-rotate. */
export function IdleOrbit({
  interactive = true,
  autoRotate = true,
  idleMs = 2500,
  minDistance = 5,
  maxDistance = 50,
  rotateSpeed = -0.5,
  autoRotateSpeed = -0.14,
  target = ORIGIN,
  minPolarAngle = POLE_EPS,
  maxPolarAngle = Math.PI - POLE_EPS,
}: IdleOrbitProps) {
  const reduceMotion = usePrefersReducedMotion();
  const canSpin = autoRotate && !reduceMotion;
  const [spinning, setSpinning] = useState(canSpin);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSpinning(canSpin);
  }, [canSpin]);

  useEffect(
    () => () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    },
    [],
  );

  const onStart = useCallback(() => {
    if (!canSpin) return;
    setSpinning(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setSpinning(true), idleMs);
  }, [canSpin, idleMs]);

  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.05}
      enablePan={false}
      enableRotate={interactive}
      enableZoom={interactive}
      rotateSpeed={rotateSpeed}
      minDistance={minDistance}
      maxDistance={maxDistance}
      minPolarAngle={minPolarAngle}
      maxPolarAngle={maxPolarAngle}
      autoRotate={spinning}
      autoRotateSpeed={autoRotateSpeed}
      target={target}
      onStart={onStart}
    />
  );
}
