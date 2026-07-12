"use client";

/**
 * React Three Fiber host for the binary black-hole banner.
 *
 * @example
 * ```tsx
 * <BlackHole spin={0.8} inclination={135} />
 * <BlackHole separation={16} accretionRate={3} />
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
import {
  Bloom,
  CameraLookAt,
  IdleOrbit,
  WebGPUCanvas,
  type BloomProps,
} from "@/components/three";
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

/** Flex-safe wrapper so the absolute canvas has a real height. */
export const SHELL_CLASS =
  "relative min-h-[7.5rem] h-full w-full flex-1 bg-background sm:min-h-[9rem] md:min-h-[11rem]";

/** Shown while hydrating or if WebGPU fails. */
export const FALLBACK_CLASS =
  "absolute inset-0 bg-[repeating-linear-gradient(45deg,var(--border)_0_1px,transparent_1px_10px)]";

export const ARIA_LABEL =
  "Interactive binary black hole — drag to orbit, scroll to zoom";

const MAX_DT = 1 / 30;
const SKY_SCALE: [number, number, number] = [-1, 1, 1];
const SKY_SEGMENTS = 24;
const DEFAULT_BLOOM: BloomProps = {
  strength: 0.35,
  radius: 0.25,
  threshold: 0.4,
};

type MeshProps = {
  config: BlackHoleConfig;
  skyRadius: number;
  simActive: boolean;
};

function BlackHoleMesh({ config, skyRadius, simActive }: MeshProps) {
  const { camera, size, invalidate } = useThree();
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
  );
}

type HostProps = {
  className?: string;
  /** Drag-orbit / scroll-zoom. @defaultValue true */
  interactive?: boolean;
  /** Slow auto-rotate when idle. @defaultValue true */
  autoRotate?: boolean;
  /**
   * Optional TSL bloom. Pass `true` for gentle defaults, or BloomProps.
   */
  bloom?: boolean | BloomProps;
  "aria-label"?: string;
};

/** Host flags + optional raw physics knobs (flat). */
export type BlackHoleProps = HostProps & PhysicsParams;

const Hatch = <div className={FALLBACK_CLASS} aria-hidden />;
const PIXEL_STYLE = { imageRendering: "pixelated" as const };
const GL_NO_AA = { antialias: false as const };

function TransparentClear() {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    scene.background = null;
    gl.setClearColor(0x000000, 0);
    gl.setClearAlpha(0);
  }, [gl, scene]);
  return null;
}

/** Apply observer knobs when inclination / D change; reset OrbitControls. */
function ObserverCamera({
  inclination,
  cameraDistance,
}: {
  inclination: number;
  cameraDistance: number;
}) {
  const { camera, controls } = useThree();

  useLayoutEffect(() => {
    const [x, y, z] = cameraPositionFromObserver(inclination, cameraDistance);
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
  }, [camera, controls, inclination, cameraDistance]);

  return null;
}

type SceneProps = {
  config: BlackHoleConfig;
  interactive: boolean;
  autoRotate: boolean;
  skyRadius: number;
  orbitMin: number;
  orbitMax: number;
  simActive: boolean;
  bloom?: boolean | BloomProps;
};

function Scene({
  config,
  interactive,
  autoRotate,
  skyRadius,
  orbitMin,
  orbitMax,
  simActive,
  bloom,
}: SceneProps) {
  const bloomProps =
    bloom === true
      ? DEFAULT_BLOOM
      : bloom && typeof bloom === "object"
        ? bloom
        : null;

  return (
    <>
      <TransparentClear />
      <ObserverCamera
        inclination={config.inclination}
        cameraDistance={config.cameraDistance}
      />
      <CameraLookAt />
      <BlackHoleMesh
        config={config}
        skyRadius={skyRadius}
        simActive={simActive}
      />
      {bloomProps ? <Bloom {...bloomProps} /> : null}
      <IdleOrbit
        interactive={interactive}
        autoRotate={autoRotate && simActive}
        minDistance={orbitMin}
        maxDistance={orbitMax}
      />
    </>
  );
}

/**
 * Client-only black-hole surface.
 * In RSC trees use `HeroBanner` from `@/components/hero-section`.
 */
export function BlackHole({
  className,
  interactive = true,
  autoRotate = true,
  bloom = false,
  "aria-label": ariaLabel = ARIA_LABEL,
  ...rest
}: BlackHoleProps) {
  const [failed, setFailed] = useState(false);
  const [inView, setInView] = useState(true);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = shellRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry?.isIntersecting ?? true);
      },
      { root: null, threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const config = buildBlackHoleConfig(pickPhysics(rest));
  const extent = binaryVisualExtent(config);
  const orbit = orbitDistanceLimits(config.cameraDistance, extent);
  const skyRadius = skyDomeRadius(orbit.max);

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

  const dpr = useMemo(() => {
    const cell = Math.max(2, config.pixelSize);
    return Math.min(1, Math.max(0.2, 1 / cell));
  }, [config.pixelSize]);

  const onFailed = useCallback(() => setFailed(true), []);
  const simActive = inView;
  const frameloop = simActive ? "always" : "demand";

  return (
    <div
      ref={shellRef}
      className={cn(SHELL_CLASS, className)}
      aria-label={ariaLabel}
      style={PIXEL_STYLE}
      data-webgpu-failed={failed ? "true" : undefined}
    >
      <WebGPUCanvas
        className="absolute inset-0 h-full w-full"
        camera={camera}
        dpr={dpr}
        fallback={Hatch}
        onFailed={onFailed}
        glProps={GL_NO_AA}
        frameloop={frameloop}
      >
        <Scene
          config={config}
          interactive={interactive}
          autoRotate={autoRotate}
          skyRadius={skyRadius}
          orbitMin={orbit.min}
          orbitMax={orbit.max}
          simActive={simActive}
          bloom={bloom}
        />
      </WebGPUCanvas>
    </div>
  );
}
