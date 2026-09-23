import { type PointerEvent, useEffect, useLayoutEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  createPointerEffect,
  type FrameClock,
  type PointerEffect,
  type PointerEffectController,
  type PointerPoint,
} from "@/lib/pointer-effect";

const browserFrameClock: FrameClock = {
  now: () => performance.now(),
  requestFrame: (callback) => requestAnimationFrame(callback),
  cancelFrame: (handle) => cancelAnimationFrame(handle),
};

function pointInElement(event: PointerEvent<Element>): PointerPoint {
  const rect = event.currentTarget.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height,
  };
}

/**
 * Runs a Pointer effect on the element the returned handlers are spread on.
 *
 * `effect` must keep its identity between renders (define it at module
 * level); a new one restarts the effect from rest. `onFrame` may change
 * every render: each frame calls the latest one.
 */
export function usePointerEffect<V extends Record<string, number>>(
  effect: PointerEffect<V>,
  onFrame: (values: Readonly<V>) => void,
  { enterDelayMs = 0 }: { enterDelayMs?: number } = {},
) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const onFrameRef = useRef(onFrame);
  const controllerRef = useRef<PointerEffectController | null>(null);

  useLayoutEffect(() => {
    onFrameRef.current = onFrame;
  });

  useEffect(() => {
    const controller = createPointerEffect(effect, {
      clock: browserFrameClock,
      onFrame: (values) => onFrameRef.current(values),
      enterDelayMs,
    });
    controller.setReducedMotion(prefersReducedMotion);
    controllerRef.current = controller;

    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, [effect, enterDelayMs, prefersReducedMotion]);

  return {
    onPointerEnter: (event: PointerEvent<Element>) =>
      controllerRef.current?.enter(pointInElement(event)),
    onPointerMove: (event: PointerEvent<Element>) =>
      controllerRef.current?.move(pointInElement(event)),
    onPointerLeave: () => controllerRef.current?.leave(),
  };
}
