"use client";

import Image from "next/image";
import {
  type PointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * Homepage banner with a circular hover lens.
 *
 * Two pixel-art layers sit on top of each other:
 *   1. the base scene (always visible)
 *   2. a "reveal" variant, clipped to a circle that follows the pointer
 *
 * Position and zoom ease toward the pointer instead of snapping, so the
 * motion stays smooth even when the mouse jumps.
 */

const ARTBOARD_WIDTH_PX = 2160;
const LENS_RADIUS_ON_ARTBOARD_PX = 160;
const REVEAL_ZOOM = 1.05;

/** Inner part of the mask that is fully opaque (the rest fades out). */
const MASK_SOLID_RATIO = 0.42;

/** Higher = the lens catches up to the pointer faster. */
const FOLLOW_SPEED = 12;

/** Cap dt so a long pause (tab backgrounded) does not jump the lens. */
const MAX_FRAME_SECONDS = 0.05;

/** Close enough to the target that we can stop the animation loop. */
const SETTLED_DISTANCE = 0.001;

/** Hide the reveal layer once the fade-out is basically done. */
const VISIBLE_SCALE_THRESHOLD = 0.02;

const BANNER_IMAGE_SIZES = "(min-width: 768px) 48rem, 100vw";

type Lens = {
  /** Horizontal position, 0 at the left edge and 1 at the right. */
  x: number;
  /** Vertical position, 0 at the top edge and 1 at the bottom. */
  y: number;
  /** 0 = hidden, 1 = fully visible and zoomed. */
  scale: number;
};

/** Centered and invisible — used before the pointer has entered. */
const HIDDEN_LENS: Lens = { x: 0.5, y: 0.5, scale: 0 };

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
 * values work at any banner width. `clientX/Y` are viewport pixels;
 * subtracting `rect.left/top` converts them to "pixels inside the box."
 */
function pointerPositionInElement(event: PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height,
  };
}

/**
 * CSS mask that punches a soft circle through the reveal image.
 *
 * `mask-image` treats opaque pixels as "show this" and transparent as
 * "hide this." The gradient is black (fully show) in the center, then
 * fades to transparent at the edge so the lens does not look like a
 * hard cookie-cutter. `x`/`y` are 0–1, converted to percents so the
 * circle stays pinned to the pointer as the banner resizes.
 */
function circularLensMask(radiusPx: number, x: number, y: number) {
  const centerX = `${x * 100}%`;
  const centerY = `${y * 100}%`;
  const solidUntil = `${MASK_SOLID_RATIO * 100}%`;

  return `radial-gradient(circle ${radiusPx}px at ${centerX} ${centerY}, #000 ${solidUntil}, transparent 100%)`;
}

/**
 * OS / browser "reduce motion" preference.
 *
 * When this is on we skip the lens entirely (no follow, no zoom) so the
 * banner stays a static image. We listen for `change` because the user
 * can flip the setting while the page is open.
 */
function usePrefersReducedMotion() {
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
 * The lens radius is authored against a 2160px artboard. We need the
 * real banner width to scale that radius down on smaller screens.
 * ResizeObserver covers window resizes and layout changes; the extra
 * `clientWidth` read covers the first paint before the observer fires.
 */
function useElementWidth(
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
function useAnimatedLens(initial: Lens = HIDDEN_LENS) {
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

export function BlackHoleBanner() {
  const rootRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const bannerWidth = useElementWidth(rootRef, ARTBOARD_WIDTH_PX);
  const { lens, moveTo, fadeOut } = useAnimatedLens();

  // Radius was designed on a 2160px-wide artboard. Scale it so the
  // circle covers the same fraction of the banner on any screen.
  const lensRadiusPx =
    (LENS_RADIUS_ON_ARTBOARD_PX / ARTBOARD_WIDTH_PX) * bannerWidth;

  // Tiny leftover scale after a fade-out is not worth showing — it
  // would look like a faint speck rather than a hidden lens.
  const isLensVisible =
    !prefersReducedMotion && lens.scale > VISIBLE_SCALE_THRESHOLD;

  const mask = circularLensMask(lensRadiusPx, lens.x, lens.y);

  // Mix between 1 (no zoom) and REVEAL_ZOOM using the same scale that
  // drives opacity, so fade-in / fade-out and zoom stay in sync.
  const zoom = 1 + (REVEAL_ZOOM - 1) * lens.scale;

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (prefersReducedMotion) {
      return;
    }

    const { x, y } = pointerPositionInElement(event);
    moveTo({ x, y, scale: 1 });
  }

  function handlePointerLeave() {
    if (prefersReducedMotion) {
      return;
    }

    fadeOut();
  }

  return (
    <div
      ref={rootRef}
      className="relative aspect-2160/864 w-full touch-none select-none overflow-hidden bg-black"
      onPointerEnter={handlePointerMove}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Base scene — always visible underneath the lens. */}
      <Image
        src="/banner/black-hole-banner.png"
        alt="Pixel black hole accretion disk"
        fill
        unoptimized
        priority
        sizes={BANNER_IMAGE_SIZES}
        className="pointer-events-none object-cover [image-rendering:pixelated]"
      />
      {/*
        Reveal layer. The mask clips it to a circle; opacity fades it
        in and out. WebkitMaskImage is the Safari-prefixed twin of
        maskImage — both must be set or Safari shows the full image.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: isLensVisible ? lens.scale : 0,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        {/*
          Zoom from the pointer, not the image center. Otherwise the
          magnified pixels would drift away from the cursor.
        */}
        <Image
          src="/banner/black-hole-banner-reveal.png"
          alt=""
          fill
          unoptimized
          priority
          sizes={BANNER_IMAGE_SIZES}
          className="object-cover [image-rendering:pixelated]"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: `${lens.x * 100}% ${lens.y * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
