"use client";

/**
 * React Three Fiber host for the binary black-hole scene.
 *
 * Layout-agnostic: fills the parent box (`h-full w-full`). The parent
 * supplies size (height/width, flex grow, aspect-ratio, etc.).
 *
 * @example
 * ```tsx
 * // Parent decides the frame
 * <div className="h-64 w-full">
 *   <BlackHole spin={0.8} />
 * </div>
 *
 * // Full-bleed panel
 * <div className="absolute inset-0">
 *   <BlackHole primaryMass={0.5} secondaryMass={0.75} />
 * </div>
 * ```
 */

import { useFrame, useThree } from "@react-three/fiber";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three/webgpu";
import { CameraLookAt, IdleOrbit, WebGPUCanvas } from "@/components/three";
import { cn } from "@/lib/utils";
import {
  binaryVisualExtent,
  buildBlackHoleConfig,
  CAMERA,
  cameraPositionFromObserver,
  orbitDistanceLimits,
  pickPhysics,
  skyDomeRadius,
  type BlackHoleConfig,
  type PhysicsParams,
} from "./physics";
import { createBlackHoleShader, type BlackHoleUniforms } from "./shader";
import {
  applyConfig,
  createCameraAxes,
  createUniforms,
  syncCamera,
} from "./uniforms";

/** Root fills parent; canvas is absolute to that box. */
const ROOT_CLASS = "relative h-full w-full min-h-0";

const FALLBACK_CLASS =
  "absolute inset-0 bg-[repeating-linear-gradient(45deg,var(--border)_0_1px,transparent_1px_10px)]";

const ARIA_LABEL =
  "Interactive binary black hole — drag to orbit, scroll to zoom";

const MAX_DT = 1 / 30;
const SKY_SEGMENTS = 24;
const SKY_SCALE: [number, number, number] = [-1, 1, 1];
const PIXEL_STYLE = { imageRendering: "pixelated" as const };
const GL_NO_AA = { antialias: false as const };
const Hatch = <div className={FALLBACK_CLASS} aria-hidden />;

type SceneProps = {
  config: BlackHoleConfig;
  interactive: boolean;
  autoRotate: boolean;
  skyRadius: number;
  orbitMin: number;
  orbitMax: number;
  simActive: boolean;
};

/**
 * R3F scene: transparent clear, observer pose, skydome mesh, idle orbit.
 */
function Scene({
  config,
  interactive,
  autoRotate,
  skyRadius,
  orbitMin,
  orbitMax,
  simActive,
}: SceneProps) {
  const { camera, controls, gl, scene, size, invalidate } = useThree();
  const axes = useRef(createCameraAxes());
  const uniformsRef = useRef<BlackHoleUniforms | null>(null);
  if (!uniformsRef.current) {
    uniformsRef.current = createUniforms(config);
  }
  const uniforms = uniformsRef.current;

  const fragmentNode = useMemo(
    () => createBlackHoleShader(uniforms),
    [uniforms],
  );

  useLayoutEffect(() => {
    scene.background = null;
    gl.setClearColor(0x000000, 0);
    gl.setClearAlpha(0);
  }, [gl, scene]);

  useLayoutEffect(() => {
    const [x, y, z] = cameraPositionFromObserver(
      config.inclination,
      config.cameraDistance,
    );
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    if ("updateProjectionMatrix" in camera) {
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
    if (
      controls &&
      typeof controls === "object" &&
      "target" in controls &&
      "update" in controls
    ) {
      const orbit = controls as {
        target: THREE.Vector3;
        update: () => void;
      };
      orbit.target.set(0, 0, 0);
      orbit.update();
    }
  }, [camera, controls, config.inclination, config.cameraDistance]);

  useLayoutEffect(() => {
    applyConfig(uniforms, config);
  }, [config, uniforms]);

  useLayoutEffect(() => {
    uniforms.resolution.value.set(
      Math.max(1, size.width),
      Math.max(1, size.height),
    );
  }, [size.width, size.height, uniforms]);

  useLayoutEffect(() => {
    if (simActive) invalidate();
  }, [simActive, invalidate]);

  useFrame((_, delta) => {
    syncCamera(uniforms, camera, axes.current);
    if (!simActive) return;
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "hidden"
    ) {
      return;
    }
    uniforms.time.value += Math.min(delta, MAX_DT);
  });

  const geoArgs = useMemo(
    (): [number, number, number] => [skyRadius, SKY_SEGMENTS, SKY_SEGMENTS],
    [skyRadius],
  );

  return (
    <>
      <CameraLookAt />
      <mesh frustumCulled={false} scale={SKY_SCALE}>
        <sphereGeometry args={geoArgs} />
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
      <IdleOrbit
        interactive={interactive}
        autoRotate={autoRotate && simActive}
        minDistance={orbitMin}
        maxDistance={orbitMax}
      />
    </>
  );
}

/** Host chrome + optional raw physics knobs (flat). */
export type BlackHoleProps = PhysicsParams & {
  /** Extra classes on the root (still fills parent unless overridden). */
  className?: string;
  /** Drag-orbit / scroll-zoom. @defaultValue true */
  interactive?: boolean;
  /** Slow auto-rotate when idle. @defaultValue true */
  autoRotate?: boolean;
  "aria-label"?: string;
};

/**
 * Client-only black-hole surface. Fills its parent element.
 *
 * For the home hero layout use `HeroBanner` in `@/components/hero-section`
 * (that wrapper owns banner size / flex).
 */
export function BlackHole({
  className,
  interactive = true,
  autoRotate = true,
  "aria-label": ariaLabel = ARIA_LABEL,
  ...rest
}: BlackHoleProps) {
  const [failed, setFailed] = useState(false);
  const [inView, setInView] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? true),
      { root: null, threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const config = buildBlackHoleConfig(pickPhysics(rest));
  const extent = binaryVisualExtent(config);
  const orbit = orbitDistanceLimits(config.cameraDistance, extent);
  const skyRadius = skyDomeRadius(orbit.max);
  const dpr = Math.min(1, Math.max(0.2, 1 / Math.max(2, config.pixelSize)));
  const onFailed = useCallback(() => setFailed(true), []);

  const camera = useMemo(
    () => ({
      fov: CAMERA.fovDeg,
      near: 0.1,
      far: Math.max(1000, skyRadius * 2),
      position: cameraPositionFromObserver(
        config.inclination,
        config.cameraDistance,
      ),
    }),
    [config.inclination, config.cameraDistance, skyRadius],
  );

  return (
    <div
      ref={rootRef}
      className={cn(ROOT_CLASS, className)}
      aria-label={ariaLabel}
      style={PIXEL_STYLE}
      data-webgpu-failed={failed ? "true" : undefined}
    >
      <WebGPUCanvas
        className="absolute inset-0 size-full"
        camera={camera}
        dpr={dpr}
        fallback={Hatch}
        onFailed={onFailed}
        glProps={GL_NO_AA}
        frameloop={inView ? "always" : "demand"}
      >
        <Scene
          config={config}
          interactive={interactive}
          autoRotate={autoRotate}
          skyRadius={skyRadius}
          orbitMin={orbit.min}
          orbitMax={orbit.max}
          simActive={inView}
        />
      </WebGPUCanvas>
    </div>
  );
}
