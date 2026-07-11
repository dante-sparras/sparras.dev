"use client";

/**
 * WebGPU Schwarzschild black hole (dgreenheck port) on React Three Fiber.
 *
 * @example
 * <BlackHole className="h-40 w-full" />
 * <BlackHole overrides={{ diskBrightness: 6, bloomStrength: 0.7 }} />
 *
 * From Server Components use `BlackHoleBanner` (Next 16 forbids ssr:false in RSC).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bloom,
  CameraLookAt,
  IdleOrbit,
  WebGPUCanvas,
} from "@/components/three";
import { useTheme } from "@/components/providers";
import { themeModeFromResolved } from "@/lib/theme";
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

function Scene({ config, interactive, autoRotate }: SceneProps) {
  // Stable identity for R3F attach (oxlint react-perf).
  const bg = useMemo(
    () => [config.starBackgroundColor] as [string],
    [config.starBackgroundColor],
  );

  return (
    <>
      <color attach="background" args={bg} />
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
  const mode = themeModeFromResolved(resolvedTheme);

  useEffect(() => setReady(true), []);

  const config = useMemo(
    () =>
      buildBlackHoleConfig({
        overrides,
        themeColors: ready && themeColors,
        root: ready ? document.documentElement : null,
        mode,
      }),
    [overrides, themeColors, mode, ready],
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
