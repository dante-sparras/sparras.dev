"use client";

/**
 * WebGPU Schwarzschild black hole (dgreenheck port) on React Three Fiber.
 *
 * Void color is NOT painted by the GPU — the host shell uses `bg-background`
 * (#050505 in dark) and the canvas is transparent there. That avoids every
 * Three color-management / bloom path fighting CSS.
 *
 * @example
 * <BlackHole className="h-40 w-full" />
 * <BlackHole overrides={{ diskBrightness: 6, bloomStrength: 0.7 }} />
 *
 * From Server Components use `HeroBanner` via `@/components/hero-section`.
 */
import { useThree } from "@react-three/fiber";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  Bloom,
  CameraLookAt,
  IdleOrbit,
  WebGPUCanvas,
} from "@/components/three";
import { useTheme } from "next-themes";
import { useCssTokens } from "@/hooks";
import { cn } from "@/lib/utils";
import {
  buildBlackHoleConfig,
  type BlackHoleConfig,
  type BlackHoleOverrides,
} from "./config";
import { ARIA_LABEL, CAMERA, FALLBACK_CLASS, SHELL_CLASS } from "./constants";
import { BlackHoleMesh } from "./mesh";

/**
 * Small public surface — most knobs stay on site defaults + theme.
 * Use `overrides` only for rare advanced tweaks.
 */
export type BlackHoleProps = {
  className?: string;
  interactive?: boolean;
  autoRotate?: boolean;
  /** Pull colors from CSS theme tokens. Default true. */
  themeColors?: boolean;
  /** Stable advanced knobs (brightness, bloom, stars on/off, …). */
  overrides?: BlackHoleOverrides;
  "aria-label"?: string;
};

const Hatch = <div className={FALLBACK_CLASS} aria-hidden />;

type SceneProps = {
  config: BlackHoleConfig;
  interactive: boolean;
  autoRotate: boolean;
};

/** Transparent clear so shell `bg-background` is the void. */
function TransparentClear() {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    scene.background = null;
    gl.setClearColor(0x000000, 0);
    gl.setClearAlpha(0);
    // R3F may restore clears — re-assert every time the canvas is (re)created.
    const canvas = gl.domElement as HTMLCanvasElement | undefined;
    if (canvas?.style) {
      canvas.style.background = "transparent";
      canvas.style.backgroundColor = "transparent";
    }
  }, [gl, scene]);
  return null;
}

function Scene({ config, interactive, autoRotate }: SceneProps) {
  return (
    <>
      <TransparentClear />
      <CameraLookAt />
      <BlackHoleMesh config={config} />
      <IdleOrbit interactive={interactive} autoRotate={autoRotate} />
      <Bloom
        strength={config.bloomStrength}
        radius={config.bloomRadius}
        threshold={config.bloomThreshold}
      />
    </>
  );
}

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
  const tokens = useCssTokens();

  useEffect(() => setReady(true), []);

  const mode =
    resolvedTheme === "light" || resolvedTheme === "dark"
      ? resolvedTheme
      : undefined;

  const config = useMemo(
    () =>
      buildBlackHoleConfig({
        overrides,
        themeColors: Boolean(ready && themeColors && mode && tokens),
        mode,
        tokens,
      }),
    [overrides, themeColors, mode, tokens, ready],
  );

  const onFailed = useCallback(() => setFailed(true), []);

  return (
    <div
      className={cn(SHELL_CLASS, className)}
      aria-label={ariaLabel}
      data-webgpu-failed={failed ? "true" : undefined}
    >
      {!ready ? (
        Hatch
      ) : (
        <WebGPUCanvas
          className="absolute inset-0 h-full w-full"
          camera={CAMERA}
          fallback={Hatch}
          onFailed={onFailed}
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
