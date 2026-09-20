"use client";

import Image from "next/image";
import { type PointerEvent, useRef } from "react";
import {
  circularLensMask,
  pointerPositionInElement,
  revealZoom,
  useAnimatedLens,
  useElementWidth,
  usePrefersReducedMotion,
  VISIBLE_SCALE_THRESHOLD,
} from "@/components/hover-lens";
import { cn } from "@/lib/utils";

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
const HOLE_SCALE = 1.25;
const MOBILE_BREAKPOINT_PX = 768;
/** Hole center as a fraction of the banner width on small screens. */
const MOBILE_HOLE_SHIFT_X = 0.66;
const BANNER_IMAGE_SIZES = "(min-width: 768px) 48rem, 100vw";
const HOLE_LAYER_CLASS =
  "absolute top-1/2 left-[66%] size-[125%] -translate-x-1/2 -translate-y-1/2 md:left-1/2";

/** Pointer 0–1 in the banner box → origin % on the overscanned image. */
function pointerOriginOnScaledLayer(x: number, y: number, shiftX: number) {
  const along = (value: number, shift: number) =>
    ((value - (shift - HOLE_SCALE / 2)) / HOLE_SCALE) * 100;
  return `${along(x, shiftX)}% ${along(y, 0.5)}%`;
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
  const holeShiftX =
    bannerWidth < MOBILE_BREAKPOINT_PX ? MOBILE_HOLE_SHIFT_X : 0.5;

  // Tiny leftover scale after a fade-out is not worth showing — it
  // would look like a faint speck rather than a hidden lens.
  const isLensVisible =
    !prefersReducedMotion && lens.scale > VISIBLE_SCALE_THRESHOLD;

  const mask = circularLensMask(lensRadiusPx, lens.x, lens.y);

  // Mix between 1 (no zoom) and REVEAL_ZOOM using the same scale that
  // drives opacity, so fade-in / fade-out and zoom stay in sync.
  const zoom = revealZoom(lens.scale);

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
      {/*
        Both layers are 1.25× the banner box and centered, so the hole
        reads larger and the cropped edges stay hidden by overflow.
      */}
      <div className={cn("pointer-events-none", HOLE_LAYER_CLASS)}>
        <Image
          src="/banner/black-hole-banner.png"
          alt="Pixel black hole accretion disk"
          fill
          unoptimized
          priority
          sizes={BANNER_IMAGE_SIZES}
          className="object-cover [image-rendering:pixelated]"
        />
      </div>
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
          magnified pixels would drift away from the cursor. Origin is
          remapped onto the 1.25× layer so the zoom stays under the mouse.
        */}
        <div className={HOLE_LAYER_CLASS}>
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
              transformOrigin: pointerOriginOnScaledLayer(
                lens.x,
                lens.y,
                holeShiftX,
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}
