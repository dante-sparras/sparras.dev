"use client";

/**
 * TSL bloom via RenderPipeline — optional glow only.
 *
 * Scene color is already display-referred for a premultiplied WebGPU canvas.
 * Bloom must only ADD glow — never re-scale scene.rgb by alpha.
 * If setup fails, bloom is skipped; the scene still renders normally.
 *
 * Three.js post-processing types are incomplete for WebGPU; we use narrow
 * structural types at the TSL boundary (never `any`).
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

type BloomUniforms = {
  threshold: { value: number };
  strength: { value: number };
  radius: { value: number };
};

/** Minimal chainable TSL node surface used by this file. */
type TslNode = {
  r: TslNode;
  g: TslNode;
  b: TslNode;
  rgb: TslNode;
  a: TslNode;
  add: (n: TslNode) => TslNode;
  sub: (n: TslNode) => TslNode;
  max: (n: TslNode) => TslNode;
  mul: (n: TslNode) => TslNode;
  min: (n: TslNode) => TslNode;
  toVec4: (a: TslNode) => unknown;
};

type BloomNode = BloomUniforms & { rgb: TslNode };

type RenderFn = (...args: never[]) => void;
type RendererLike = {
  render: RenderFn;
  setClearColor: (color: number, alpha?: number) => void;
  setClearAlpha: (alpha: number) => void;
};

type RenderPipelineCtor = new (gl: unknown) => Pipeline;

type ThreeWithPost = typeof THREE & {
  RenderPipeline?: RenderPipelineCtor;
  PostProcessing?: RenderPipelineCtor;
};

type ScenePassLike = {
  transparent?: boolean;
  opaque?: boolean;
  renderTarget?: { texture?: { colorSpace: string } };
  getTextureNode: () => TslNode;
};

type QuadMeshLike = {
  material?: THREE.Material & {
    transparent?: boolean;
    premultipliedAlpha?: boolean;
    toneMapped?: boolean;
    blending?: number;
    needsUpdate?: boolean;
    depthWrite?: boolean;
    depthTest?: boolean;
  };
};

type TslApi = {
  pass: (scene: unknown, camera: unknown) => ScenePassLike;
  max: (a: TslNode, b: TslNode) => TslNode;
  float: (n: number) => TslNode;
};

function getRenderPipelineCtor(): RenderPipelineCtor | null {
  const t = THREE as ThreeWithPost;
  return t.RenderPipeline ?? t.PostProcessing ?? null;
}

function applyBloomParams(
  node: BloomUniforms,
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

function readQuadMesh(post: Pipeline): QuadMeshLike | null {
  // three.js private compose quad — transparent PM setup only
  const bag = post as Pipeline & { _quadMesh?: QuadMeshLike };
  // oxlint-disable-next-line eslint/no-underscore-dangle -- three.js private API
  return bag._quadMesh ?? null;
}

function isRendererLike(gl: unknown): gl is RendererLike {
  return (
    typeof gl === "object" &&
    gl !== null &&
    "render" in gl &&
    "setClearColor" in gl &&
    "setClearAlpha" in gl
  );
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
        const tsl = (await import("three/tsl")) as unknown as TslApi;
        const bloomMod =
          (await import("three/addons/tsl/display/BloomNode.js")) as unknown as {
            bloom: (color: TslNode) => BloomNode;
          };
        if (cancelled) return;

        const Ctor = getRenderPipelineCtor();
        if (!Ctor) return;

        scene.background = null;
        gl.setClearColor(0x000000, 0);
        gl.setClearAlpha(0);

        const post = new Ctor(gl);
        post.outputColorTransform = false;

        const scenePass = tsl.pass(scene, camera);
        scenePass.transparent = true;
        scenePass.opaque = true;

        if (scenePass.renderTarget?.texture) {
          scenePass.renderTarget.texture.colorSpace = THREE.NoColorSpace;
        }

        const sceneColor = scenePass.getTextureNode();
        const node = bloomMod.bloom(sceneColor);
        applyBloomParams(
          node,
          initial.current.strength,
          initial.current.radius,
          initial.current.threshold,
        );

        const bloomRgb = node.rgb;
        const bloomLuma = tsl.max(bloomRgb.r, tsl.max(bloomRgb.g, bloomRgb.b));
        const bloomA = bloomLuma
          .sub(tsl.float(0.02))
          .max(tsl.float(0.0))
          .mul(tsl.float(1.1))
          .min(tsl.float(1.0));
        const outA = tsl.max(sceneColor.a, bloomA);
        post.outputNode = sceneColor.rgb.add(bloomRgb).toVec4(outA);
        post.needsUpdate = true;

        const quad = readQuadMesh(post);
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
        if (isRendererLike(gl)) {
          uninstall = installRenderHook(gl, postRef, restoreRef);
        }
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
