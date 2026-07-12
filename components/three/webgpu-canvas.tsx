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
 * Site defaults: NoToneMapping + sRGB output so CSS hex (e.g. #050505) matches the page.
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
import { cn } from "@/lib/utils";

// ── Catalog: three/webgpu constructors as JSX ───────────────────────────────

declare module "@react-three/fiber" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

let catalogReady = false;
function ensureCatalog() {
  if (catalogReady) return;
  extend(THREE as never);
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
} as const;

async function createWebGPURenderer(props: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- R3F passes a props bag typed for WebGL
  const renderer = new THREE.WebGPURenderer(props as any);
  await renderer.init();
  renderer.toneMapping = THREE.NoToneMapping;
  // sRGB encode on write — matches CSS / hex colors from the design system.
  // LinearSRGB output made voids look near-black (sRGB decode without re-encode).
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

// ── Public component ────────────────────────────────────────────────────────

export type WebGPUCanvasProps = Omit<CanvasProps, "gl" | "children"> & {
  children: ReactNode;
  className?: string;
  onFailed?: () => void;
  fallback?: ReactNode;
};

/** Full-bleed WebGPU R3F canvas. Feature scenes are pure children. */
export function WebGPUCanvas({
  children,
  className,
  onFailed,
  fallback = null,
  dpr = DPR,
  camera = DEFAULT_CAMERA,
  ...rest
}: WebGPUCanvasProps) {
  const [failed, setFailed] = useState(false);
  const onFailedRef = useRef(onFailed);
  onFailedRef.current = onFailed;

  const fail = useCallback(() => {
    setFailed(true);
    onFailedRef.current?.();
  }, []);

  /** Stable factory — R3F only needs it once; failures go through `fail`. */
  const gl = useCallback(
    async (props: Record<string, unknown>) => {
      try {
        return await createWebGPURenderer(props);
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
          frameloop="always"
          gl={gl as never}
          style={CANVAS_STYLE}
          {...rest}
        >
          {children}
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
