"use client";

/**
 * React Three Fiber host for the binary black-hole banner.
 *
 * Structure:
 * - {@link BlackHole} — public component (canvas shell, theme, camera)
 * - {@link BlackHoleMesh} — inverted sphere + TSL material + uniforms
 *
 * Physics knobs live in `./config` (`defaultPhysics` / `BlackHoleOverrides`).
 *
 * @example
 * ```tsx
 * <BlackHole overrides={{ separation: 16, spin: 0.7 }} />
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
import { uniform } from "three/tsl";
import { CameraLookAt, IdleOrbit, WebGPUCanvas } from "@/components/three";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  buildBlackHoleConfig,
  cameraPositionFromObserver,
  type BlackHoleConfig,
  type BlackHoleOverrides,
} from "./config";
import {
  CONFIG_SCALAR_KEYS,
  createBlackHoleShader,
  type BlackHoleUniforms,
} from "./shader";

// ── Shell / a11y (also used by HeroBanner loading hatch) ────────────────────

/** Flex-safe wrapper so the absolute canvas has a real height. */
export const SHELL_CLASS =
  "relative min-h-[7.5rem] h-full w-full flex-1 bg-background sm:min-h-[9rem] md:min-h-[11rem]";

/** Shown while hydrating or if WebGPU fails. */
export const FALLBACK_CLASS =
  "absolute inset-0 bg-[repeating-linear-gradient(45deg,var(--border)_0_1px,transparent_1px_10px)]";

export const ARIA_LABEL =
  "Interactive binary black hole — drag to orbit, scroll to zoom";

// ── GPU uniforms ────────────────────────────────────────────────────────────

/** Create the uniform bag once; scalar fields start from `config`. */
function createUniforms(config: BlackHoleConfig): BlackHoleUniforms {
  const uniforms = {
    time: uniform(0),
    resolution: uniform(new THREE.Vector2(1, 1)),
    cameraPosition: uniform(new THREE.Vector3()),
    cameraForward: uniform(new THREE.Vector3(0, 0, -1)),
    cameraRight: uniform(new THREE.Vector3(1, 0, 0)),
    cameraUp: uniform(new THREE.Vector3(0, 1, 0)),
    cameraFov: uniform(48),
  } as unknown as BlackHoleUniforms;

  for (const key of CONFIG_SCALAR_KEYS) {
    uniforms[key] = uniform(config[key]);
  }
  return uniforms;
}

/** Push every physics/render scalar from config into live uniforms. */
function applyConfig(uniforms: BlackHoleUniforms, config: BlackHoleConfig) {
  for (const key of CONFIG_SCALAR_KEYS) {
    uniforms[key].value = config[key];
  }
}

/** Scratch space for camera basis vectors (avoid alloc each frame). */
type CameraAxes = {
  right: THREE.Vector3;
  up: THREE.Vector3;
  forward: THREE.Vector3;
};

/**
 * Copy world camera pose into uniforms so the shader can build rays.
 * Three.js cameras look down local −Z; we store that as `cameraForward`.
 */
function syncCamera(
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

/** Cap dt so orbital phase stays stable if the tab freezes. */
const MAX_DT = 1 / 30;
/** Flip X so the sphere is inside-out (we render the interior sky). */
const SKY_SCALE: [number, number, number] = [-1, 1, 1];
/** Sphere radius, width segments, height segments. */
const SKY_GEO: [number, number, number] = [80, 24, 24];

/**
 * Full-sky raymarch surface: inverted sphere + MeshBasicNodeMaterial.
 * Uniforms live for the lifetime of the mesh; config is patched on change.
 */
function BlackHoleMesh({ config }: { config: BlackHoleConfig }) {
  const { camera, size } = useThree();
  const axes = useRef<CameraAxes>({
    right: new THREE.Vector3(1, 0, 0),
    up: new THREE.Vector3(0, 1, 0),
    forward: new THREE.Vector3(0, 0, -1),
  });

  // Create uniforms once (stable identity → stable TSL graph)
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

  useFrame((_, delta) => {
    uniforms.time.value += Math.min(delta, MAX_DT);
    syncCamera(uniforms, camera, axes.current);
  });

  return (
    <mesh frustumCulled={false} scale={SKY_SCALE}>
      <sphereGeometry args={SKY_GEO} />
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

// ── Public host ─────────────────────────────────────────────────────────────

export type BlackHoleProps = {
  className?: string;
  /** Drag-orbit / scroll-zoom. @defaultValue true */
  interactive?: boolean;
  /** Slow auto-rotate when idle. @defaultValue true */
  autoRotate?: boolean;
  /** Dim disks in light theme. @defaultValue true */
  themeColors?: boolean;
  /** Physics overrides (see `BlackHoleOverrides` / `defaultPhysics`). */
  overrides?: BlackHoleOverrides;
  "aria-label"?: string;
};

const Hatch = <div className={FALLBACK_CLASS} aria-hidden />;
const PIXEL_STYLE = { imageRendering: "pixelated" as const };
/** No MSAA — keeps pixel edges crisp. */
const GL_NO_AA = { antialias: false as const };

/** Transparent clear so empty sky shows the page background. */
function TransparentClear() {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    scene.background = null;
    gl.setClearColor(0x000000, 0);
    gl.setClearAlpha(0);
    const el = gl.domElement as HTMLCanvasElement | undefined;
    if (el?.style) {
      el.style.background = "transparent";
      el.style.backgroundColor = "transparent";
      el.style.imageRendering = "pixelated";
    }
  }, [gl, scene]);
  return null;
}

function Scene({
  config,
  interactive,
  autoRotate,
}: {
  config: BlackHoleConfig;
  interactive: boolean;
  autoRotate: boolean;
}) {
  return (
    <>
      <TransparentClear />
      <CameraLookAt />
      <BlackHoleMesh config={config} />
      <IdleOrbit
        interactive={interactive}
        autoRotate={autoRotate}
        minDistance={Math.max(4, config.cameraDistance * 0.45)}
        maxDistance={config.cameraDistance * 2.8}
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
  themeColors = true,
  overrides,
  "aria-label": ariaLabel = ARIA_LABEL,
}: BlackHoleProps) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => setReady(true), []);

  const theme =
    resolvedTheme === "light" || resolvedTheme === "dark"
      ? resolvedTheme
      : undefined;

  const config = useMemo(
    () =>
      buildBlackHoleConfig({
        overrides,
        themeColors: Boolean(ready && themeColors && theme),
        mode: theme,
      }),
    [overrides, themeColors, theme, ready],
  );

  const camera = useMemo(
    () => ({
      fov: 48,
      near: 0.1,
      far: 1000,
      position: cameraPositionFromObserver(
        config.inclination,
        config.cameraDistance,
      ),
    }),
    [config.inclination, config.cameraDistance],
  );

  // Lower DPR ≈ fewer fragments ≈ chunkier pixels (matches pixelSize intent)
  const dpr = useMemo(() => {
    const cell = Math.max(2, config.pixelSize);
    return Math.min(1, Math.max(0.2, 1 / cell));
  }, [config.pixelSize]);

  const onFailed = useCallback(() => setFailed(true), []);

  return (
    <div
      className={cn(SHELL_CLASS, className)}
      aria-label={ariaLabel}
      style={PIXEL_STYLE}
      data-webgpu-failed={failed ? "true" : undefined}
    >
      {!ready ? (
        Hatch
      ) : (
        <WebGPUCanvas
          className="absolute inset-0 h-full w-full"
          camera={camera}
          dpr={dpr}
          fallback={Hatch}
          onFailed={onFailed}
          glProps={GL_NO_AA}
        >
          <Scene
            config={config}
            interactive={interactive}
            autoRotate={autoRotate}
          />
        </WebGPUCanvas>
      )}
    </div>
  );
}
