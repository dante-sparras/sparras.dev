"use client";

import { useRender } from "@base-ui/react/use-render";
import {
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useId,
  useRef,
} from "react";
import { usePointerEffect } from "@/hooks/use-pointer-effect";
import { rgbSplit, rgbSplitOffsets } from "@/lib/pointer-effect";
import { cn } from "@/lib/utils";

export type RgbSplitTarget = "content" | "border" | "both";

const GREEN_RATIO = 0.2;
const BORDER_SPLIT_PX = 1;
const BORDER_ENTER_DELAY_MS = 150;

type OffsetRefs = {
  red: RefObject<SVGFEOffsetElement | null>;
  green: RefObject<SVGFEOffsetElement | null>;
  blue: RefObject<SVGFEOffsetElement | null>;
};

function writeOffset(
  node: SVGFEOffsetElement | null,
  { x, y }: { x: number; y: number },
) {
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
 * One SVG channel filter driven by the pointer. Mutates its `feOffset` nodes
 * so the filter can run on any painted source.
 */
function useChannelFilter({
  splitPx,
  greenPx,
  enterDelayMs,
}: {
  splitPx: number;
  greenPx: number;
  enterDelayMs?: number;
}) {
  const id = cssFilterId(useId());
  const red = useRef<SVGFEOffsetElement>(null);
  const green = useRef<SVGFEOffsetElement>(null);
  const blue = useRef<SVGFEOffsetElement>(null);

  const handlers = usePointerEffect(
    rgbSplit,
    (values) => {
      const offsets = rgbSplitOffsets(values, { splitPx, greenPx });
      writeOffset(red.current, offsets.red);
      writeOffset(green.current, offsets.green);
      writeOffset(blue.current, offsets.blue);
    },
    { enterDelayMs },
  );

  return {
    id,
    style: { filter: `url(#${id})` },
    offsetRefs: { red, green, blue } satisfies OffsetRefs,
    handlers,
  };
}

function ChannelFilter({
  id,
  offsetRefs,
}: {
  id: string;
  offsetRefs: OffsetRefs;
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

/**
 * RGB split on the `render` element, following the pointer while it is
 * over it. Pass the content as `children`, not on `render`: the module
 * wraps it so only the content is filtered. Splitting the border replaces
 * the element's own border with a filtered 1px ring.
 */
export function RgbSplit({
  render,
  split = "content",
  strength = 3,
  children,
}: {
  render: ReactElement;
  split?: RgbSplitTarget;
  /** How far red and blue pull apart, in px. */
  strength?: number;
  children: ReactNode;
}) {
  const splitContent = split !== "border";
  const splitBorder = split !== "content";
  const content = useChannelFilter({
    splitPx: strength,
    greenPx: strength * GREEN_RATIO,
  });
  const border = useChannelFilter({
    splitPx: BORDER_SPLIT_PX,
    greenPx: 0,
    enterDelayMs: BORDER_ENTER_DELAY_MS,
  });
  const filters = [
    ...(splitContent ? [content] : []),
    ...(splitBorder ? [border] : []),
  ];

  return useRender({
    render,
    props: {
      className: cn("group/rgb-split", splitBorder && "border-transparent"),
      onPointerEnter: (event: PointerEvent<Element>) => {
        for (const filter of filters) {
          filter.handlers.onPointerEnter(event);
        }
      },
      onPointerMove: (event: PointerEvent<Element>) => {
        for (const filter of filters) {
          filter.handlers.onPointerMove(event);
        }
      },
      onPointerLeave: () => {
        for (const filter of filters) {
          filter.handlers.onPointerLeave();
        }
      },
      children: (
        <>
          {filters.map((filter) => (
            <ChannelFilter
              key={filter.id}
              id={filter.id}
              offsetRefs={filter.offsetRefs}
            />
          ))}
          {splitBorder ? (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[inherit] border border-border transition-colors duration-150 group-hover/rgb-split:border-foreground group-focus-visible/rgb-split:border-foreground"
              style={border.style}
            />
          ) : null}
          <span
            className={cn(
              "relative inline-flex size-full items-center justify-center gap-[inherit]",
              splitBorder && "z-10",
            )}
            style={splitContent ? content.style : undefined}
          >
            {children}
          </span>
        </>
      ),
    },
  });
}
