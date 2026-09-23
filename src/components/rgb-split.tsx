"use client";

import { type RefObject, useId, useRef } from "react";
import { usePointerEffect } from "@/hooks/use-pointer-effect";
import { rgbSplit } from "@/lib/pointer-effect";

export type RgbSplitOffsetRefs = {
  red: RefObject<SVGFEOffsetElement | null>;
  green: RefObject<SVGFEOffsetElement | null>;
  blue: RefObject<SVGFEOffsetElement | null>;
};

type UseRgbSplitHoverOptions = {
  splitPx: number;
  greenPx: number;
  enterDelayMs?: number;
};

function writeOffset(node: SVGFEOffsetElement | null, x: number, y: number) {
  if (!node) {
    return;
  }
  node.dx.baseVal = x;
  node.dy.baseVal = y;
  node.setAttribute("dx", String(x));
  node.setAttribute("dy", String(y));
}

function cssFilterId(reactId: string) {
  return `rgb-split-${reactId.replace(/:/g, "")}`;
}

/**
 * Pointer-following chromatic split. Mutates SVG `feOffset` nodes so the
 * filter can run on any painted source (an image, or a border-only overlay).
 */
export function useRgbSplitHover({
  splitPx,
  greenPx,
  enterDelayMs,
}: UseRgbSplitHoverOptions) {
  const filterId = cssFilterId(useId());
  const redOffsetRef = useRef<SVGFEOffsetElement>(null);
  const greenOffsetRef = useRef<SVGFEOffsetElement>(null);
  const blueOffsetRef = useRef<SVGFEOffsetElement>(null);
  const offsetRefs: RgbSplitOffsetRefs = {
    red: redOffsetRef,
    green: greenOffsetRef,
    blue: blueOffsetRef,
  };

  const { onPointerEnter, onPointerMove, onPointerLeave } = usePointerEffect(
    rgbSplit,
    ({ amount, angle }) => {
      const x = Math.cos(angle);
      const y = Math.sin(angle);
      const redX = x * splitPx * amount;
      const redY = y * splitPx * amount;
      const blueX = -x * splitPx * amount;
      const blueY = -y * splitPx * amount;
      const greenX = -y * greenPx * amount;
      const greenY = x * greenPx * amount;
      writeOffset(redOffsetRef.current, redX, redY);
      writeOffset(blueOffsetRef.current, blueX, blueY);
      writeOffset(greenOffsetRef.current, greenX, greenY);
    },
    { enterDelayMs },
  );

  return {
    filterId,
    filterStyle: { filter: `url(#${filterId})` },
    offsetRefs,
    onPointerEnter,
    onPointerMove,
    onPointerLeave,
  };
}

export function RgbSplitFilter({
  id,
  offsetRefs,
}: {
  id: string;
  offsetRefs: RgbSplitOffsetRefs;
}) {
  return (
    <svg aria-hidden className="absolute size-0">
      <filter
        id={id}
        x="-20%"
        y="-20%"
        width="140%"
        height="140%"
        colorInterpolationFilters="sRGB"
      >
        <feOffset
          ref={offsetRefs.red}
          dx="0"
          dy="0"
          in="SourceGraphic"
          result="offR"
        />
        <feColorMatrix
          in="offR"
          result="r"
          type="matrix"
          values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
        />
        <feOffset
          ref={offsetRefs.green}
          dx="0"
          dy="0"
          in="SourceGraphic"
          result="offG"
        />
        <feColorMatrix
          in="offG"
          result="g"
          type="matrix"
          values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
        />
        <feOffset
          ref={offsetRefs.blue}
          dx="0"
          dy="0"
          in="SourceGraphic"
          result="offB"
        />
        <feColorMatrix
          in="offB"
          result="b"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
        />
        <feBlend in="r" in2="g" mode="screen" result="rg" />
        <feBlend in="rg" in2="b" mode="screen" />
      </filter>
    </svg>
  );
}

/** 1px ring whose painted border is the filter source. Content stays unfiltered. */
export function RgbSplitBorderOverlay({
  filterStyle,
}: {
  filterStyle: { filter: string };
}) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit] border border-border transition-colors duration-150 group-hover/button:border-foreground group-focus-visible/button:border-foreground"
      style={filterStyle}
    />
  );
}
