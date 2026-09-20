"use client";

import {
  type PointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export const REVEAL_ZOOM = 1.05;

/** Inner part of the mask that is fully opaque (the rest fades out). */
const MASK_SOLID_RATIO = 0.42;

/** Higher = the lens catches up to the pointer faster. */
const FOLLOW_SPEED = 12;

/** Cap dt so a long pause (tab backgrounded) does not jump the lens. */
const MAX_FRAME_SECONDS = 0.05;

/** Close enough to the target that we can stop the animation loop. */
const SETTLED_DISTANCE = 0.001;

/** Hide the reveal layer once the fade-out is basically done. */
export const VISIBLE_SCALE_THRESHOLD = 0.02;

export type Lens = {
  /** Horizontal position, 0 at the left edge and 1 at the right. */
  x: number;
  /** Vertical position, 0 at the top edge and 1 at the bottom. */
  y: number;
  /** 0 = hidden, 1 = fully visible and zoomed. */
  scale: number;
};

/** Centered and invisible — used before the pointer has entered. */
export const HIDDEN_LENS: Lens = { x: 0.5, y: 0.5, scale: 0 };

/**
 * Linear interpolation: walk `amount` of the way from `from` toward `to`.
 *
 * `amount` is 0–1. 0 returns `from`, 1 returns `to`, 0.5 is halfway.
 */
function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

/** Move every lens field (x, y, scale) the same fraction toward a target. */
function lerpLens(from: Lens, to: Lens, amount: number): Lens {
  return {
    x: lerp(from.x, to.x, amount),
    y: lerp(from.y, to.y, amount),
    scale: lerp(from.scale, to.scale, amount),
  };
}

/**
 * True when the animated lens is close enough to its target that another
 * frame would not be visible. We compare each field because x/y and scale
 * settle at different times (the pointer can still be moving while fade
 * has already finished, or vice versa).
 */
function isSettled(current: Lens, target: Lens) {
  return (
    Math.abs(current.x - target.x) < SETTLED_DISTANCE &&
    Math.abs(current.y - target.y) < SETTLED_DISTANCE &&
    Math.abs(current.scale - target.scale) < SETTLED_DISTANCE
  );
}

/**
 * How far to move this frame, independent of frame rate.
 *
 * A naive step like `speed * dt` overshoots when a frame is late
 * (big dt → step past the target). The exponential
 * `1 - e^(-speed * dt)` always stays in 0–1, so we ease toward the
 * target and never jump past it.
 */
function exponentialEase(speed: number, dt: number) {
  return 1 - Math.exp(-speed * dt);
}

/**
 * Pointer location as 0–1 coordinates inside the hovered element.
 *
 * We normalize by the element's box (not the viewport) so the same
 * values work at any size. `clientX/Y` are viewport pixels;
 * subtracting `rect.left/top` converts them to "pixels inside the box."
 */
export function pointerPositionInElement(event: PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height,
  };
}

/**
 * CSS mask that punches a soft circle through the reveal layer.
 *
 * `mask-image` treats opaque pixels as "show this" and transparent as
 * "hide this." The gradient is black (fully show) in the center, then
 * fades to transparent at the edge so the lens does not look like a
 * hard cookie-cutter. `x`/`y` are 0–1, converted to percents so the
 * circle stays pinned to the pointer as the element resizes.
 */
export function circularLensMask(radiusPx: number, x: number, y: number) {
  const centerX = `${x * 100}%`;
  const centerY = `${y * 100}%`;
  const solidUntil = `${MASK_SOLID_RATIO * 100}%`;

  return `radial-gradient(circle ${radiusPx}px at ${centerX} ${centerY}, #000 ${solidUntil}, transparent 100%)`;
}

/**
 * OS / browser "reduce motion" preference.
 *
 * When this is on we skip the lens entirely (no follow, no zoom).
 * We listen for `change` because the user can flip the setting while
 * the page is open.
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(media.matches);

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return prefersReducedMotion;
}

/**
 * Live width of a DOM node, starting from `fallbackWidth` on the first
 * render (the node is not mounted yet, so we cannot measure it).
 *
 * ResizeObserver covers window resizes and layout changes; the extra
 * `clientWidth` read covers the first paint before the observer fires.
 */
export function useElementWidth(
  ref: RefObject<HTMLElement | null>,
  fallbackWidth: number,
) {
  const [width, setWidth] = useState(fallbackWidth);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(element);
    setWidth(element.clientWidth);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}

/**
 * Smoothly chase a moving lens target with requestAnimationFrame.
 *
 * Why refs AND state?
 *   - `targetRef` / `currentRef` are read inside the rAF loop. Updating
 *     them does not re-render, so the loop can run at 60fps without
 *     fighting React.
 *   - `lens` state is what the JSX reads. We copy the latest values
 *     there once per frame so React paints the mask and zoom.
 *
 * `rafIdRef` is the handle of the running loop (`null` = idle). We
 * only start a new loop when one is not already going; later
 * `moveTo` / `fadeOut` calls just overwrite `targetRef` and the
 * current loop steers toward the new target.
 */
export function useAnimatedLens(initial: Lens = HIDDEN_LENS) {
  const targetRef = useRef(initial);
  const currentRef = useRef(initial);
  const rafIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);
  const [lens, setLens] = useState(initial);

  const stopAnimation = useCallback(() => {
    if (rafIdRef.current == null) {
      return;
    }

    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
  }, []);

  const startAnimation = useCallback(() => {
    // Already ticking — the loop will pick up the new targetRef itself.
    if (rafIdRef.current != null) {
      return;
    }

    lastFrameTimeRef.current = performance.now();

    const tick = (now: number) => {
      // Seconds since the last frame. Capped so a backgrounded tab
      // (which can wake up with dt of several seconds) does not
      // teleport the lens in one step.
      const elapsedSeconds = (now - lastFrameTimeRef.current) / 1000;
      const dt = Math.min(MAX_FRAME_SECONDS, elapsedSeconds);
      lastFrameTimeRef.current = now;

      const next = lerpLens(
        currentRef.current,
        targetRef.current,
        exponentialEase(FOLLOW_SPEED, dt),
      );

      currentRef.current = next;
      setLens(next);

      // Snap to the exact target and stop. Leaving the loop running
      // after we have arrived would waste frames and keep React
      // re-rendering a still image.
      if (isSettled(next, targetRef.current)) {
        currentRef.current = targetRef.current;
        setLens(targetRef.current);
        rafIdRef.current = null;
        return;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  // Cancel the loop if the component unmounts mid-animation.
  useEffect(() => stopAnimation, [stopAnimation]);

  /** Point the lens at a new position / scale and start easing there. */
  const moveTo = useCallback(
    (next: Lens) => {
      targetRef.current = next;
      startAnimation();
    },
    [startAnimation],
  );

  /**
   * Shrink scale to 0 without moving x/y.
   *
   * If we also reset position, the circle would slide back to the
   * center while fading, which looks like the lens is running away.
   * Keeping the last pointer spot makes it dissolve in place.
   */
  const fadeOut = useCallback(() => {
    targetRef.current = {
      x: currentRef.current.x,
      y: currentRef.current.y,
      scale: 0,
    };
    startAnimation();
  }, [startAnimation]);

  return { lens, moveTo, fadeOut };
}

export function revealZoom(scale: number) {
  return 1 + (REVEAL_ZOOM - 1) * scale;
}
