"use client";

/**
 * TSL bloom via RenderPipeline — optional glow only.
 *
 * Black-hole shader writes a buffer that is already correct for a
 * premultiplied WebGPU canvas (disk = lit*coverage, stars additive).
 * Bloom must only ADD glow — never re-scale scene.rgb by alpha.
 *
 * If setup fails, bloom is skipped; the scene still renders normally.
 */
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three/webgpu";

export type BloomProps = {
  strength?: number;
  radius?: number;
  threshold?: number;
};

type Pipeline = {
  render: () => void;
  outputNode: unknown;
  outputColorTransform?: boolean;
  needsUpdate?: boolean;
};
type BloomNode = {
  threshold: { value: number };
  strength: { value: number };
  radius: { value: number };
};
type RenderFn = (...args: never[]) => void;
type RendererLike = {
  render: RenderFn;
  setClearColor: (color: number, alpha?: number) => void;
  setClearAlpha: (alpha: number) => void;
};

function applyBloomParams(
  node: BloomNode,
  strength: number,
  radius: number,
  threshold: number,
) {
  node.threshold.value = threshold;
  node.strength.value = strength;
  node.radius.value = radius;
}

function installRenderHook(
  gl: RendererLike,
  postRef: { current: Pipeline | null },
  restoreRef: { current: RenderFn | null },
) {
  const real = gl.render.bind(gl) as RenderFn;
  restoreRef.current = real;
  let depth = 0;

  gl.render = ((...args: never[]) => {
    if (depth > 0 || !postRef.current) return real(...args);
    depth += 1;
    try {
      gl.setClearColor(0x000000, 0);
      gl.setClearAlpha(0);
      postRef.current.render();
    } finally {
      depth -= 1;
    }
  }) as RenderFn;

  return () => {
    if (restoreRef.current) {
      gl.render = restoreRef.current;
      restoreRef.current = null;
    }
  };
}

export function Bloom({
  strength = 0.6,
  radius = 0.3,
  threshold = 0.35,
}: BloomProps) {
  const { gl, scene, camera } = useThree();
  const postRef = useRef<Pipeline | null>(null);
  const bloomRef = useRef<BloomNode | null>(null);
  const restoreRef = useRef<RenderFn | null>(null);
  const initial = useRef({ strength, radius, threshold });

  useLayoutEffect(() => {
    let cancelled = false;
    let uninstall: (() => void) | undefined;

    void (async () => {
      try {
        const { pass, max, float } = await import("three/tsl");
        const { bloom } = await import("three/addons/tsl/display/BloomNode.js");
        if (cancelled) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Ctor =
          (THREE as any).RenderPipeline ?? (THREE as any).PostProcessing;
        if (!Ctor) return;

        scene.background = null;
        gl.setClearColor(0x000000, 0);
        gl.setClearAlpha(0);

        const post = new Ctor(gl) as Pipeline;
        // No extra tone-map / color-space pass — matches direct canvas path.
        post.outputColorTransform = false;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scenePass: any = pass(scene, camera);
        scenePass.transparent = true;
        scenePass.opaque = true;

        // Display-referred values in the RT — do not treat as sRGB textures.
        if (scenePass.renderTarget?.texture) {
          scenePass.renderTarget.texture.colorSpace = THREE.NoColorSpace;
        }

        const sceneColor = scenePass.getTextureNode();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const node: any = bloom(sceneColor);
        applyBloomParams(
          node,
          initial.current.strength,
          initial.current.radius,
          initial.current.threshold,
        );

        // scene.rgb is already the final buffer color (PM disk + additive stars).
        // Bloom is additive only — do not multiply by alpha.
        const bloomRgb = node.rgb;
        const bloomLuma = max(bloomRgb.r, max(bloomRgb.g, bloomRgb.b));
        const bloomA = bloomLuma
          .sub(float(0.02))
          .max(float(0.0))
          .mul(float(1.1))
          .min(float(1.0));
        const outA = max(sceneColor.a, bloomA);
        post.outputNode = sceneColor.rgb.add(bloomRgb).toVec4(outA);
        post.needsUpdate = true;

        // Compose quad must blend so a=0 void stays transparent.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-underscore-dangle -- three.js private API
        const quad = (post as any)._quadMesh;
        if (quad?.material) {
          const mat = quad.material;
          mat.transparent = true;
          mat.premultipliedAlpha = true;
          mat.depthWrite = false;
          mat.depthTest = false;
          mat.toneMapped = false;
          mat.blending = THREE.NormalBlending;
          mat.needsUpdate = true;
        }

        if (cancelled) return;

        postRef.current = post;
        bloomRef.current = node;
        uninstall = installRenderHook(
          gl as unknown as RendererLike,
          postRef,
          restoreRef,
        );
      } catch (err) {
        console.warn("[Bloom] skipped (scene still renders):", err);
      }
    })();

    return () => {
      cancelled = true;
      uninstall?.();
      postRef.current = null;
      bloomRef.current = null;
    };
  }, [gl, scene, camera]);

  useLayoutEffect(() => {
    const node = bloomRef.current;
    if (!node) return;
    applyBloomParams(node, strength, radius, threshold);
  }, [strength, radius, threshold]);

  return null;
}
