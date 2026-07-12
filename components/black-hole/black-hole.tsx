"use client";

/**
 * React Three Fiber host for the binary black-hole banner.
 *
 * Structure:
 * - {@link BlackHole} — public component (canvas shell, theme, camera)
 * - {@link BlackHoleMesh} — inverted sphere + TSL material + uniforms
 *
 * Physics knobs live in `./config` (`defaultPhysics` / `BlackHoleOverrides`).
 * GPU bag plumbing: `./uniforms`.
 *
 * @example
 * ```tsx
 * // Flat knobs — only pass what you change
 * <BlackHole spin={0.8} inclination={135} />
 *
 * // Nested bag
 * <BlackHole physics={{ separation: 16, accretionRate: 3 }} />
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
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  buildBlackHoleConfig,
  cameraPositionFromObserver,
  CAMERA_FOV_DEG,
  mergePhysicsOverrides,
  orbitDistanceLimits,
  pickPhysicsOverrides,
  skyDomeRadius,
  type BlackHoleConfig,
  type BlackHoleOverrides,
} from "./config";
import { createBlackHoleShader, type BlackHoleUniforms } from "./shader";
import {
  applyConfig,
  createCameraAxes,
  createUniforms,
  syncCamera,
} from "./uniforms";

// ── Shell / a11y (also used by HeroBanner loading hatch) ────────────────────

/** Flex-safe wrapper so the absolute canvas has a real height. */
export const SHELL_CLASS =
  "relative min-h-[7.5rem] h-full w-full flex-1 bg-background sm:min-h-[9rem] md:min-h-[11rem]";

/** Shown while hydrating or if WebGPU fails. */
export const FALLBACK_CLASS =
  "absolute inset-0 bg-[repeating-linear-gradient(45deg,var(--border)_0_1px,transparent_1px_10px)]";

export const ARIA_LABEL =
  "Interactive binary black hole — drag to orbit, scroll to zoom";

/** Cap dt so orbital phase stays stable if the tab freezes. */
const MAX_DT = 1 / 30;
/** Flip X so the sphere is inside-out (we render the interior sky). */
const SKY_SCALE: [number, number, number] = [-1, 1, 1];
/** Sphere width/height segments (shell is fullscreen; low poly is fine). */
const SKY_SEGMENTS = 24;

/** Gentle default bloom when `bloom` is enabled without custom props. */
const DEFAULT_BLOOM: BloomProps = {
  strength: 0.35,
  radius: 0.25,
  threshold: 0.4,
};

/**
 * Full-sky raymarch surface: inverted sphere + MeshBasicNodeMaterial.
 * Uniforms live for the lifetime of the mesh; config is patched on change.
 */
function BlackHoleMesh({
  config,
  skyRadius,
  simActive,
}: {
  config: BlackHoleConfig;
  skyRadius: number;
  /** When false, skip time advance (tab hidden or off-screen). */
  simActive: boolean;
}) {
  const { camera, size, invalidate } = useThree();
  const axes = useRef(createCameraAxes());

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

  // When becoming active again under demand/always switch, force a frame
  useLayoutEffect(() => {
    if (simActive) invalidate();
  }, [simActive, invalidate]);

  useFrame((_, delta) => {
    // Always sync camera so first visible frame is correct
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

// ── Public host ─────────────────────────────────────────────────────────────

type BlackHoleHostProps = {
  className?: string;
  /** Drag-orbit / scroll-zoom. @defaultValue true */
  interactive?: boolean;
  /** Slow auto-rotate when idle. @defaultValue true */
  autoRotate?: boolean;
  /** Dim disks in light theme. @defaultValue true */
  themeColors?: boolean;
  /**
   * Optional TSL bloom (premultiplied-safe). Default off for the hero grade.
   * Pass `true` for gentle defaults, or a {@link BloomProps} object.
   */
  bloom?: boolean | BloomProps;
  /**
   * Nested partial physics bag (same keys as top-level knobs).
   * Merge order: `physics` → `overrides` → top-level knobs (later wins).
   */
  physics?: BlackHoleOverrides;
  /**
   * Alias of {@link BlackHoleHostProps.physics} (historical).
   * Prefer flat knobs or `physics` for new code.
   */
  overrides?: BlackHoleOverrides;
  "aria-label"?: string;
};

/**
 * Public props: host flags **plus optional raw physics knobs**.
 *
 * Only pass knobs you want to change — site {@link defaultPhysics} fill the rest.
 *
 * @example
 * ```tsx
 * <BlackHole spin={0.9} inclination={135} />
 * <BlackHole physics={{ separation: 16 }} />
 * ```
 */
export type BlackHoleProps = BlackHoleHostProps & BlackHoleOverrides;

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
  }, [gl, scene]);
  return null;
}

/**
 * Apply observer knobs to the live R3F camera when inclination / D change.
 * Canvas `camera={{ position }}` only seeds mount; OrbitControls owns pose after,
 * so we must re-apply position and refresh controls when D changes.
 */
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
    // OrbitControls caches spherical radius — force sync to new D
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

function Scene({
  config,
  interactive,
  autoRotate,
  skyRadius,
  orbitMin,
  orbitMax,
  simActive,
  bloom,
}: {
  config: BlackHoleConfig;
  interactive: boolean;
  autoRotate: boolean;
  skyRadius: number;
  orbitMin: number;
  orbitMax: number;
  simActive: boolean;
  bloom?: boolean | BloomProps;
}) {
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
 *
 * Pass only the physics knobs you want to change (flat or via `physics`):
 * ```tsx
 * <BlackHole spin={0.9} inclination={135} />
 * ```
 */
export function BlackHole({
  className,
  interactive = true,
  autoRotate = true,
  themeColors = true,
  bloom = false,
  physics,
  overrides,
  "aria-label": ariaLabel = ARIA_LABEL,
  ...rest
}: BlackHoleProps) {
  const [failed, setFailed] = useState(false);
  /** IntersectionObserver: pause sim when the banner is off-screen. */
  const [inView, setInView] = useState(true);
  const shellRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  // Flat physics knobs on the component (preferred DX)
  const flatPhysics = useMemo(() => pickPhysicsOverrides(rest), [rest]);
  const physicsBag = useMemo(
    () => mergePhysicsOverrides(physics, overrides, flatPhysics),
    [physics, overrides, flatPhysics],
  );

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

  const theme =
    resolvedTheme === "light" || resolvedTheme === "dark"
      ? resolvedTheme
      : undefined;

  const config = useMemo(
    () =>
      buildBlackHoleConfig({
        physics: physicsBag,
        themeColors: Boolean(themeColors && theme),
        mode: theme,
      }),
    [physicsBag, themeColors, theme],
  );

  const orbit = useMemo(
    () => orbitDistanceLimits(config.cameraDistance),
    [config.cameraDistance],
  );
  const skyRadius = useMemo(() => skyDomeRadius(orbit.max), [orbit.max]);

  const camera = useMemo(
    () => ({
      fov: CAMERA_FOV_DEG,
      near: 0.1,
      far: Math.max(1000, skyRadius * 2),
      position: cameraPositionFromObserver(
        config.inclination,
        config.cameraDistance,
      ),
    }),
    [config.inclination, config.cameraDistance, skyRadius],
  );

  // Pixel art: lower DPR = fewer fragments = chunkier pixels (single path)
  const dpr = useMemo(() => {
    const cell = Math.max(2, config.pixelSize);
    return Math.min(1, Math.max(0.2, 1 / cell));
  }, [config.pixelSize]);

  const onFailed = useCallback(() => setFailed(true), []);
  const simActive = inView;
  // Always while on-screen (orbit + time); demand off-screen to free GPU
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
