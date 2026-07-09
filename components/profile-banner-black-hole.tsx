"use client";

/**
 * Profile banner black hole — faithful port of dgreenheck/webgpu-black-hole
 * (Three.js WebGPU + TSL raymarch + bloom) into the short identity-row slot.
 *
 * Ref: https://github.com/dgreenheck/webgpu-black-hole
 *   blackhole.js · blackhole-shader.js · main.js (defaults, OrbitControls, bloom)
 *
 * Hatch CSS remains under the canvas as progressive-enhancement fallback.
 */

import { useEffect, useRef, useState } from "react";

export function ProfileBannerBlackHole() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let raf = 0;
    let detach: (() => void) | null = null;

    (async () => {
      // Dynamic imports keep three/webgpu off the server bundle path.
      const THREE = await import("three/webgpu");
      const { pass } = await import("three/tsl");
      const { bloom } = await import("three/addons/tsl/display/BloomNode.js");
      const { OrbitControls } =
        await import("three/addons/controls/OrbitControls.js");
      const { BlackHoleSimulation } =
        await import("@/lib/black-hole/blackhole.js");
      const { defaultBlackHoleConfig, defaultCamera } =
        await import("@/lib/black-hole/defaults.js");

      if (disposed || !host) return;

      while (host.firstChild) host.removeChild(host.firstChild);

      const config = { ...defaultBlackHoleConfig };

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);

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
      renderer.toneMapping = THREE.ACESFilmicToneMapping;

      const canvas = renderer.domElement;
      canvas.style.display = "block";
      canvas.style.position = "absolute";
      canvas.style.inset = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.touchAction = "none";
      canvas.style.cursor = "grab";
      canvas.setAttribute("aria-hidden", "true");
      host.appendChild(canvas);

      try {
        await renderer.init();
      } catch (err) {
        console.error("[ProfileBannerBlackHole] WebGPU init failed:", err);
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
      controls.target.set(0, 0, 0);
      controls.update();

      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Gentle idle orbit (reference cinematic is off by default; banner uses soft spin).
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

      // three r185+: RenderPipeline (PostProcessing is a deprecated subclass alias)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Pipeline =
        (THREE as any).RenderPipeline ?? (THREE as any).PostProcessing;
      const postProcessing = new Pipeline(renderer);
      const scenePass = pass(scene, camera);
      const scenePassColor = scenePass.getTextureNode();
      const bloomPassNode = bloom(scenePassColor);
      bloomPassNode.threshold.value = config.bloomThreshold;
      bloomPassNode.strength.value = config.bloomStrength;
      bloomPassNode.radius.value = config.bloomRadius;
      postProcessing.outputNode = scenePassColor.add(bloomPassNode);

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
        markInteract();
        canvas.style.cursor = "grabbing";
      };
      const onPointerUp = () => {
        canvas.style.cursor = "grab";
      };
      const onWheel = () => {
        markInteract();
      };

      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointerup", onPointerUp);
      canvas.addEventListener("pointercancel", onPointerUp);
      canvas.addEventListener("wheel", onWheel, { passive: true });

      let lastFrameTime = performance.now();

      const tick = (now: number) => {
        if (disposed) return;
        const deltaTime = Math.min((now - lastFrameTime) / 1000, 0.033);
        lastFrameTime = now;

        if (!reduceMotion && !userInteracting) {
          // Slow azimuth spin around target (banner idle motion)
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

      detach = () => {
        cancelAnimationFrame(raf);
        if (idleResumeTimer) clearTimeout(idleResumeTimer);
        ro.disconnect();
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointercancel", onPointerUp);
        canvas.removeEventListener("wheel", onWheel);
        controls.dispose();
        if (sim.blackHoleMesh) {
          scene.remove(sim.blackHoleMesh);
          sim.blackHoleMesh.geometry?.dispose();
          // Node materials dispose via material.dispose when available
          const mat = sim.blackHoleMesh.material;
          if (mat && !Array.isArray(mat)) mat.dispose();
        }
        renderer.dispose();
        while (host.firstChild) host.removeChild(host.firstChild);
      };
    })().catch((err) => {
      console.error("[ProfileBannerBlackHole]", err);
      if (!disposed) setFailed(true);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      detach?.();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="relative min-h-0 h-full w-full flex-1 bg-black"
      aria-label="Interactive black hole simulation — drag to orbit, scroll to zoom"
      data-webgpu-failed={failed ? "true" : undefined}
    >
      {/* Hatch fallback only when WebGPU is unavailable */}
      {failed ? (
        <div
          className="absolute inset-0 bg-[repeating-linear-gradient(45deg,var(--border)_0_1px,transparent_1px_10px)]"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
