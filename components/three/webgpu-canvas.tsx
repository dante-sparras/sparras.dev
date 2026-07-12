"use client";

/**
 * Shared R3F Canvas on Three WebGPU.
 *
 * Official gl factory (pmndrs docs):
 *   gl={async (props) => {
 *     const r = new THREE.WebGPURenderer(props);
 *     await r.init();
 *     return r;
 *   }}
 *
 * Color policy (CSS hex WYSIWYG with the black-hole shader):
 * - NoToneMapping
 * - LinearSRGB output — the sim is display-referred (manual γ on disk).
 */

import { Canvas, extend, type CanvasProps } from "@react-three/fiber";
import type { ThreeToJSXElements } from "@react-three/fiber/dist/declarations/src/three-types";
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";
import * as THREE from "three/webgpu";
import type { WebGPURendererParameters } from "three/webgpu";
import { cn } from "@/lib/utils";

// ── Catalog: three/webgpu constructors as JSX ───────────────────────────────

declare module "@react-three/fiber" {
  // Three.js module augmentation — empty interface merge is intentional.
  // oxlint-disable-next-line typescript/no-empty-object-type
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

let catalogReady = false;
function ensureCatalog() {
  if (catalogReady) return;
  // R3F extend expects a constructor map; three/webgpu namespace is compatible at runtime.
  extend(THREE as unknown as Parameters<typeof extend>[0]);
  catalogReady = true;
}
ensureCatalog();

// ── Error boundary (private) ────────────────────────────────────────────────

type BoundaryProps = {
  fallback?: ReactNode;
  onError?: (error: Error) => void;
  children: ReactNode;
};

class CanvasErrorBoundary extends Component<
  BoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.error("[WebGPUCanvas]", error);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}

// ── Renderer ────────────────────────────────────────────────────────────────

const DPR: [number, number] = [1, 2];

const DEFAULT_CAMERA = {
  fov: 60,
  near: 0.1,
  far: 1000,
  position: [0, 0, 5] as [number, number, number],
};

const CANVAS_STYLE = {
  position: "absolute" as const,
  inset: 0,
  width: "100%",
  height: "100%",
  display: "block",
  touchAction: "none" as const,
  background: "transparent",
  backgroundColor: "transparent",
} as const;

export type GlInitProps = {
  antialias?: boolean;
  powerPreference?: WebGPURendererParameters["powerPreference"];
  canvas?: HTMLCanvasElement | OffscreenCanvas;
  depth?: boolean;
  stencil?: boolean;
  alpha?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickCanvas(
  props: unknown,
): HTMLCanvasElement | OffscreenCanvas | undefined {
  if (!isRecord(props)) return undefined;
  const canvas = props.canvas;
  if (canvas instanceof HTMLCanvasElement) return canvas;
  if (
    typeof OffscreenCanvas !== "undefined" &&
    canvas instanceof OffscreenCanvas
  ) {
    return canvas;
  }
  return undefined;
}

async function createWebGPURenderer(
  props: unknown,
  overrides: GlInitProps = {},
): Promise<THREE.WebGPURenderer> {
  const canvas = overrides.canvas ?? pickCanvas(props);
  const parameters: WebGPURendererParameters = {
    ...(canvas ? { canvas } : {}),
    alpha: overrides.alpha ?? true,
    antialias: overrides.antialias ?? true,
    powerPreference: overrides.powerPreference ?? "high-performance",
    depth: overrides.depth,
    stencil: overrides.stencil,
  };

  const renderer = new THREE.WebGPURenderer(parameters);
  await renderer.init();
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.setClearAlpha(0);
  return renderer;
}

// ── Public component ────────────────────────────────────────────────────────

export type WebGPUCanvasProps = Omit<CanvasProps, "gl" | "children"> & {
  children: ReactNode;
  className?: string;
  onFailed?: () => void;
  fallback?: ReactNode;
  /** Extra flags merged into the WebGPURenderer constructor (e.g. antialias). */
  glProps?: GlInitProps;
  /**
   * R3F frameloop. Default `"always"` so idle auto-rotate / time-based sims
   * keep animating. Pass `"demand"` for static scenes that call `invalidate`.
   */
  frameloop?: CanvasProps["frameloop"];
};

/** Full-bleed WebGPU R3F canvas. Feature scenes are pure children. */
export function WebGPUCanvas({
  children,
  className,
  onFailed,
  fallback = null,
  dpr = DPR,
  camera = DEFAULT_CAMERA,
  glProps,
  frameloop = "always",
  ...rest
}: WebGPUCanvasProps) {
  const [failed, setFailed] = useState(false);
  const onFailedRef = useRef(onFailed);
  onFailedRef.current = onFailed;
  const glPropsRef = useRef(glProps);
  glPropsRef.current = glProps;

  const fail = useCallback(() => {
    setFailed(true);
    onFailedRef.current?.();
  }, []);

  const gl = useCallback(
    async (props: Record<string, unknown>) => {
      try {
        return await createWebGPURenderer(props, glPropsRef.current);
      } catch (err) {
        console.error("[WebGPUCanvas] init failed:", err);
        fail();
        throw err;
      }
    },
    [fail],
  );

  const shell = cn("relative h-full w-full min-h-0", className);

  if (failed) {
    return <div className={shell}>{fallback}</div>;
  }

  return (
    <div className={shell}>
      <CanvasErrorBoundary fallback={fallback} onError={fail}>
        <Canvas
          dpr={dpr}
          camera={camera}
          frameloop={frameloop}
          gl={gl}
          style={CANVAS_STYLE}
          {...rest}
        >
          {children}
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
