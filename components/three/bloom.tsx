"use client";

/**
 * TSL bloom via RenderPipeline.
 *
 * R3F ends each frame with `gl.render(scene, camera)`. We replace the top-level
 * call with `post.render()`. Nested pipeline renders must hit the real renderer —
 * the depth guard prevents infinite recursion / stack overflow.
 *
 * Alpha is preserved so transparent void pixels (CSS `bg-background`) stay open.
 * Bloom glow lifts `a` where the bloom is bright so the halo still composites.
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
type RendererLike = { render: RenderFn };

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
  // Seed values captured once for async setup; live updates go through the 2nd effect.
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

        // Ensure scene pass clears transparent (void → CSS bg).
        gl.setClearColor(0x000000, 0);
        scene.background = null;

        const post = new Ctor(gl) as Pipeline;
        // Display-referred sim — don't sRGB-encode on the way out (lifts grays).
        post.outputColorTransform = false;

        const sceneColor = pass(scene, camera).getTextureNode();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const node: any = bloom(sceneColor);
        applyBloomParams(
          node,
          initial.current.strength,
          initial.current.radius,
          initial.current.threshold,
        );

        // rgb += bloom; alpha = max(scene.a, bloom luma) so void stays open
        // unless the bloom halo itself is visible.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bloomLuma = max(node.r, max(node.g, node.b)) as any;
        post.outputNode = vec4(
          sceneColor.rgb.add(node),
          max(sceneColor.a, bloomLuma.mul(float(0.85))),
        );

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
