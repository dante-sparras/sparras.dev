"use client";

/**
 * TSL bloom via RenderPipeline.
 *
 * R3F ends each frame with `gl.render(scene, camera)`. We replace the top-level
 * call with `post.render()`. Nested pipeline renders must hit the real renderer —
 * the depth guard prevents infinite recursion / stack overflow.
 *
 * Alpha is preserved from the scene pass so void (a=0) stays transparent over
 * CSS `bg-background`. Bloom glow raises alpha only where bloom is bright.
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
  autoClear: boolean;
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
      // Transparent clear every frame so void composites over CSS.
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
        const { pass, max, float, vec4 } = await import("three/tsl");
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
        // Keep display-referred output; do not sRGB-encode (lifts void/grays).
        post.outputColorTransform = false;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scenePass: any = pass(scene, camera);
        scenePass.transparent = true;
        scenePass.opaque = true; // still draw opaque list if any
        const sceneColor = scenePass.getTextureNode();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const node: any = bloom(sceneColor);
        applyBloomParams(
          node,
          initial.current.strength,
          initial.current.radius,
          initial.current.threshold,
        );

        // Keep void a=0; only raise alpha where bloom is actually visible.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bloomLuma = max(node.r, max(node.g, node.b)) as any;
        // Soft knee so tiny bloom noise doesn't paint the whole sky opaque black.
        const bloomA = bloomLuma
          .sub(float(0.02))
          .max(float(0.0))
          .mul(float(1.15));
        post.outputNode = vec4(
          sceneColor.rgb.add(node),
          max(sceneColor.a, bloomA).min(float(1.0)),
        );

        // Full-screen compose quad must blend alpha (default NodeMaterial is opaque → a forced 1).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const quadMat = (post as any)._quadMesh?.material;
        if (quadMat) {
          quadMat.transparent = true;
          quadMat.depthWrite = false;
          quadMat.depthTest = false;
          quadMat.toneMapped = false;
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
        console.warn("[Bloom] skipped:", err);
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
