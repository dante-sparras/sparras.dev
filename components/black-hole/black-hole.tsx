"use client";

/**
 * Universal WebGPU black hole (dgreenheck/webgpu-black-hole port).
 *
 * Non-color knobs → `./defaults.ts`
 * Colors → `./theme.ts` (CSS tokens) when `themeColors` is on
 *
 * @example
 * <BlackHole className="h-40 w-full" />
 * <BlackHole interactive={false} autoRotate config={{ diskBrightness: 6 }} />
 */

import { useEffect, useRef, useState } from "react";
import { cn, hexToInt, normalizeHexOpaque } from "@/lib/utils";
import type { BlackHoleConfig, BlackHoleConfigPatch } from "./types";

function themeMode(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

const VOID_FALLBACK = "#0a0a0a";

function voidColorInt(hex: string | undefined): number {
  return hexToInt(normalizeHexOpaque(hex ?? VOID_FALLBACK) ?? VOID_FALLBACK);
}

export type BlackHoleProps = {
  className?: string;
  /** Merge over defaultBlackHoleConfig (sim knobs, optional color overrides). */
  config?: BlackHoleConfigPatch;
  /** OrbitControls drag/zoom. Default true. */
  interactive?: boolean;
  /** Gentle idle spin when not interacting. Default true. */
  autoRotate?: boolean;
  /** Sample site theme tokens for colors. Default true. */
  themeColors?: boolean;
  "aria-label"?: string;
};

export function BlackHole({
  className,
  config: configOverride,
  interactive = true,
  autoRotate = true,
  themeColors = true,
  "aria-label":
    ariaLabel = "Interactive black hole — drag to orbit, scroll to zoom",
}: BlackHoleProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let raf = 0;
    let teardown: (() => void) | null = null;

    (async () => {
      const THREE = await import("three/webgpu");
      const { pass } = await import("three/tsl");
      const { bloom } = await import("three/addons/tsl/display/BloomNode.js");
      const { OrbitControls } =
        await import("three/addons/controls/OrbitControls.js");
      const { BlackHoleSimulation } = await import("./simulation");
      const { defaultBlackHoleConfig, defaultCamera } =
        await import("./defaults");
      const { getThemeBlackHolePatch } = await import("./theme");

      if (disposed || !host) return;
      while (host.firstChild) host.removeChild(host.firstChild);

      const buildConfig = (): BlackHoleConfig => {
        const base = {
          ...defaultBlackHoleConfig,
          ...configOverride,
        } as BlackHoleConfig;
        if (themeColors) {
          const m = themeMode();
          const colors = getThemeBlackHolePatch(m, document.documentElement);
          Object.assign(base, colors, {
            diskInkMode: m === "light" ? 1 : 0,
          });
        }
        return base;
      };

      let config = buildConfig();

      const scene = new THREE.Scene();
      const voidInt = voidColorInt(config.starBackgroundColor);
      scene.background = new THREE.Color(voidInt);

      const camera = new THREE.PerspectiveCamera(
        defaultCamera.fov,
        1,
        0.1,
        1000,
      );
      camera.position.set(
        defaultCamera.position.x,
        defaultCamera.position.y,
        defaultCamera.position.z,
      );
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGPURenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(voidInt, 1);
      // Content tonemapped in-shader; void stays raw sRGB
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

      const canvas = renderer.domElement;
      Object.assign(canvas.style, {
        display: "block",
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        touchAction: "none",
        cursor: interactive ? "grab" : "default",
      });
      canvas.setAttribute("aria-hidden", "true");
      host.appendChild(canvas);

      try {
        await renderer.init();
      } catch (err) {
        console.error("[BlackHole] WebGPU init failed:", err);
        renderer.dispose();
        while (host.firstChild) host.removeChild(host.firstChild);
        if (!disposed) setFailed(true);
        return;
      }
      if (disposed) {
        renderer.dispose();
        return;
      }

      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = defaultCamera.dampingFactor;
      controls.rotateSpeed = defaultCamera.rotateSpeed;
      controls.minDistance = defaultCamera.minDistance;
      controls.maxDistance = defaultCamera.maxDistance;
      controls.enablePan = false;
      controls.enableRotate = interactive;
      controls.enableZoom = interactive;
      controls.target.set(0, 0, 0);
      controls.update();

      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let userInteracting = false;
      let idleResumeTimer: ReturnType<typeof setTimeout> | null = null;
      const markInteract = () => {
        userInteracting = true;
        if (idleResumeTimer) clearTimeout(idleResumeTimer);
        idleResumeTimer = setTimeout(() => {
          userInteracting = false;
        }, 2500);
      };

      const sim = new BlackHoleSimulation(scene, config);
      sim.createBlackHole();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Pipeline =
        (THREE as any).RenderPipeline ?? (THREE as any).PostProcessing;
      const postProcessing = new Pipeline(renderer);
      const scenePassColor = pass(scene, camera).getTextureNode();
      const bloomPassNode = bloom(scenePassColor);
      bloomPassNode.threshold.value = config.bloomThreshold;
      bloomPassNode.strength.value = config.bloomStrength;
      bloomPassNode.radius.value = config.bloomRadius;
      postProcessing.outputNode = scenePassColor.add(bloomPassNode);

      let lastThemeKey = "";
      const applyTheme = () => {
        if (!themeColors) return;
        const m = themeMode();
        const key = `${m}|${document.documentElement.className}`;
        if (key === lastThemeKey) return;
        lastThemeKey = key;

        config = buildConfig();
        sim.updateUniforms(config);

        const nextVoid = voidColorInt(config.starBackgroundColor);
        scene.background = new THREE.Color(nextVoid);
        renderer.setClearColor(nextVoid, 1);

        bloomPassNode.threshold.value = config.bloomThreshold;
        bloomPassNode.strength.value = config.bloomStrength;
        bloomPassNode.radius.value = config.bloomRadius;
      };
      applyTheme();

      const themeObserver = new MutationObserver(() => {
        lastThemeKey = "";
        applyTheme();
      });
      if (themeColors) {
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["class"],
        });
      }

      const applySize = () => {
        if (disposed || !host) return;
        const w = Math.max(1, host.clientWidth);
        const h = Math.max(1, host.clientHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        sim.onResize(w, h);
      };
      applySize();
      const ro = new ResizeObserver(applySize);
      ro.observe(host);

      const onPointerDown = () => {
        if (!interactive) return;
        markInteract();
        canvas.style.cursor = "grabbing";
      };
      const onPointerUp = () => {
        if (!interactive) return;
        canvas.style.cursor = "grab";
      };
      const onWheel = () => {
        if (interactive) markInteract();
      };

      if (interactive) {
        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("pointerup", onPointerUp);
        canvas.addEventListener("pointercancel", onPointerUp);
        canvas.addEventListener("wheel", onWheel, { passive: true });
      }

      let lastFrameTime = performance.now();
      const tick = (now: number) => {
        if (disposed) return;
        const deltaTime = Math.min((now - lastFrameTime) / 1000, 0.033);
        lastFrameTime = now;

        applyTheme();

        if (autoRotate && !reduceMotion && !userInteracting) {
          const offset = camera.position.clone().sub(controls.target);
          const spherical = new THREE.Spherical().setFromVector3(offset);
          spherical.theta += 0.08 * deltaTime;
          camera.position
            .copy(controls.target)
            .add(new THREE.Vector3().setFromSpherical(spherical));
          camera.lookAt(controls.target);
        }

        controls.update();
        sim.update(deltaTime, camera);
        postProcessing.render();
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      teardown = () => {
        cancelAnimationFrame(raf);
        if (idleResumeTimer) clearTimeout(idleResumeTimer);
        themeObserver.disconnect();
        ro.disconnect();
        if (interactive) {
          canvas.removeEventListener("pointerdown", onPointerDown);
          canvas.removeEventListener("pointerup", onPointerUp);
          canvas.removeEventListener("pointercancel", onPointerUp);
          canvas.removeEventListener("wheel", onWheel);
        }
        controls.dispose();
        sim.dispose();
        renderer.dispose();
        while (host.firstChild) host.removeChild(host.firstChild);
      };
    })().catch((err) => {
      console.error("[BlackHole]", err);
      if (!disposed) setFailed(true);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      teardown?.();
    };
  }, [autoRotate, configOverride, interactive, themeColors]);

  return (
    <div
      ref={hostRef}
      className={cn(
        "relative min-h-0 h-full w-full flex-1 bg-background",
        className,
      )}
      aria-label={ariaLabel}
      data-webgpu-failed={failed ? "true" : undefined}
    >
      {failed ? (
        <div
          className="absolute inset-0 bg-[repeating-linear-gradient(45deg,var(--border)_0_1px,transparent_1px_10px)]"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
