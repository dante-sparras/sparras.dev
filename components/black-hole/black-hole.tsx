"use client";

/**
 * WebGPU Schwarzschild black hole on React Three Fiber.
 *
 * Port of dgreenheck/webgpu-black-hole (MIT), rebuilt for this site:
 * - R3F scene graph + shared WebGPUCanvas kit
 * - Conserved E/L null geodesics (not ad-hoc 1/r² bend)
 * - Transparent void via Discard + CSS `bg-background` (#050505)
 * - No post-process bloom (async pipeline dulled disk/horizon)
 *
 * @example
 * <BlackHole className="h-40 w-full" />
 * <BlackHole overrides={{ diskBrightness: 6, starsEnabled: true }} />
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
import { CameraLookAt, IdleOrbit, WebGPUCanvas } from "@/components/three";
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

export type BlackHoleProps = {
  className?: string;
  interactive?: boolean;
  autoRotate?: boolean;
  /** Pull colors from CSS theme tokens. Default true. */
  themeColors?: boolean;
  overrides?: BlackHoleOverrides;
  "aria-label"?: string;
};

const Hatch = <div className={FALLBACK_CLASS} aria-hidden />;

type SceneProps = {
  config: BlackHoleConfig;
  interactive: boolean;
  autoRotate: boolean;
};

/** Transparent clear so shell `bg-background` is the sky void. */
function TransparentClear() {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    scene.background = null;
    gl.setClearColor(0x000000, 0);
    gl.setClearAlpha(0);
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
