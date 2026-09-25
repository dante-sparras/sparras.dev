"use client";

import { useRender } from "@base-ui/react/use-render";
import {
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { usePointerEffect } from "@/hooks/use-pointer-effect";
import {
  type RgbSplitValues,
  rgbSplit,
  rgbSplitOffsets,
} from "@/lib/pointer-effect";
import { cn } from "@/lib/utils";

const GREEN_RATIO = 0.2;
const DEFAULT_STRENGTH = 3;
/** Same follow speed as the pointer effect, so a delayed layer eases in instead of popping. */
const FOLLOW_SPEED = 12;
const MAX_FRAME_SECONDS = 0.05;

export type RgbSplitLayer = {
  /** How far red and blue pull apart, in px. */
  strength?: number;
  /**
   * How far green drifts across the split axis, in px.
   * Defaults to 20% of `strength`. `0` keeps green still.
   */
  green?: number;
  /** Hold this layer at rest for this long after the pointer enters. */
  delayMs?: number;
  /**
   * Clip the filtered content to the host's padding box. Use this when the
   * artwork must stay inside a mask, such as a circular avatar. The clip
   * wraps the filter, so the shifted channels cannot cover the border.
   */
  clip?: boolean;
};

type ResolvedLayer = {
  strength: number;
  green: number;
  delayMs: number;
};

type OffsetRefs = {
  red: RefObject<SVGFEOffsetElement | null>;
  green: RefObject<SVGFEOffsetElement | null>;
  blue: RefObject<SVGFEOffsetElement | null>;
};

type Box = { width: number; height: number };

function resolveLayer(layer: RgbSplitLayer): ResolvedLayer {
  const strength = layer.strength ?? DEFAULT_STRENGTH;
  return {
    strength,
    green: layer.green ?? strength * GREEN_RATIO,
    delayMs: layer.delayMs ?? 0,
  };
}

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

function writeFlood(node: SVGFEFloodElement | null, opacity: number) {
  if (!node) {
    return;
  }
  node.setAttribute("flood-opacity", String(opacity));
}

function cssFilterId(reactId: string) {
  return `rgb-split-${reactId.replace(/:/g, "")}`;
}

/** Filter region with at least `padPx` of room on every side. */
function filterRegion(padPx: number, { width, height }: Box) {
  const padX = width > 0 ? (padPx / width) * 100 : 50;
  const padY = height > 0 ? (padPx / height) * 100 : 50;
  return {
    x: `${-padX}%`,
    y: `${-padY}%`,
    width: `${100 + padX * 2}%`,
    height: `${100 + padY * 2}%`,
  };
}

function copyBorder(host: HTMLElement, ring: HTMLElement) {
  const inline = host.style.borderColor;
  host.style.transition = "none";
  host.style.borderColor = "";
  const style = getComputedStyle(host);
  ring.style.borderWidth = style.borderTopWidth;
  ring.style.borderStyle = style.borderTopStyle;
  ring.style.borderColor = style.borderTopColor;
  host.style.borderColor = inline || "transparent";
  host.getBoundingClientRect();
  host.style.transition = "";
}

/**
 * One SVG channel filter driven by the pointer. Mutates its `feOffset` nodes
 * so the filter can run on any painted source.
 */
function ContentFilter({
  id,
  padPx,
  box,
  offsetRefs,
}: {
  id: string;
  padPx: number;
  box: Box;
  offsetRefs: OffsetRefs;
}) {
  return (
    <svg aria-hidden className="absolute size-0">
      <filter
        id={id}
        {...filterRegion(padPx, box)}
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
 * Border fringe: the center stroke keeps the element's own border, and red
 * and blue are bright copies of that stroke so a dark border still splits.
 */
function BorderFilter({
  id,
  padPx,
  box,
  offsetRefs,
  floodRefs,
}: {
  id: string;
  padPx: number;
  box: Box;
  offsetRefs: OffsetRefs;
  floodRefs: {
    red: RefObject<SVGFEFloodElement | null>;
    blue: RefObject<SVGFEFloodElement | null>;
  };
}) {
  return (
    <svg aria-hidden className="absolute size-0">
      <filter
        id={id}
        {...filterRegion(padPx, box)}
        colorInterpolationFilters="sRGB"
      >
        <feOffset
          ref={offsetRefs.green}
          dx="0"
          dy="0"
          in="SourceGraphic"
          result="g"
        />
        <feOffset
          ref={offsetRefs.red}
          dx="0"
          dy="0"
          in="SourceAlpha"
          result="offR"
        />
        <feFlood
          ref={floodRefs.red}
          floodColor="#ff0000"
          floodOpacity="0"
          result="floodR"
        />
        <feComposite in="floodR" in2="offR" operator="in" result="r" />
        <feOffset
          ref={offsetRefs.blue}
          dx="0"
          dy="0"
          in="SourceAlpha"
          result="offB"
        />
        <feFlood
          ref={floodRefs.blue}
          floodColor="#0000ff"
          floodOpacity="0"
          result="floodB"
        />
        <feComposite in="floodB" in2="offB" operator="in" result="b" />
        <feBlend in="g" in2="r" mode="screen" result="gr" />
        <feBlend in="gr" in2="b" mode="screen" />
      </filter>
    </svg>
  );
}

/**
 * RGB split on the `render` element, following the pointer while it is over
 * it. Pass artwork as `children`: it is wrapped so a content layer filters
 * only that artwork. A border layer replaces the host border with a filtered
 * ring that copies the host's width and color.
 *
 * The host is `overflow-visible` so a border fringe can paint outside the box.
 * Set `content.clip` to keep a content split inside the host's padding box.
 */
export function RgbSplit({
  render,
  content,
  border,
  children,
}: {
  render: ReactElement;
  content?: RgbSplitLayer;
  border?: RgbSplitLayer;
  children: ReactNode;
}) {
  const contentLayer = content ? resolveLayer(content) : null;
  const borderLayer = border ? resolveLayer(border) : null;
  const contentId = cssFilterId(useId());
  const borderId = cssFilterId(useId());
  const hostRef = useRef<HTMLElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<Box>({ width: 0, height: 0 });

  const contentRed = useRef<SVGFEOffsetElement>(null);
  const contentGreen = useRef<SVGFEOffsetElement>(null);
  const contentBlue = useRef<SVGFEOffsetElement>(null);
  const borderRed = useRef<SVGFEOffsetElement>(null);
  const borderGreen = useRef<SVGFEOffsetElement>(null);
  const borderBlue = useRef<SVGFEOffsetElement>(null);
  const floodRed = useRef<SVGFEFloodElement>(null);
  const floodBlue = useRef<SVGFEFloodElement>(null);

  const contentRef = useRef(contentLayer);
  const borderRef = useRef(borderLayer);
  contentRef.current = contentLayer;
  borderRef.current = borderLayer;

  const latest = useRef<RgbSplitValues>(rgbSplit.rest);
  const borderMotion = useRef({
    amount: 0,
    enteredAt: null as number | null,
    lastAt: 0,
    raf: 0,
  });

  function stopPump() {
    const motion = borderMotion.current;
    if (motion.raf) {
      cancelAnimationFrame(motion.raf);
      motion.raf = 0;
    }
  }

  function paint(now: number) {
    stopPump();
    const values = latest.current;
    const contentNow = contentRef.current;
    if (contentNow) {
      const offsets = rgbSplitOffsets(values, {
        splitPx: contentNow.strength,
        greenPx: contentNow.green,
      });
      writeOffset(contentRed.current, offsets.red);
      writeOffset(contentGreen.current, offsets.green);
      writeOffset(contentBlue.current, offsets.blue);
    }

    const borderNow = borderRef.current;
    if (!borderNow) {
      return;
    }

    const motion = borderMotion.current;
    const holding =
      borderNow.delayMs > 0 &&
      motion.enteredAt != null &&
      now - motion.enteredAt < borderNow.delayMs;
    const target = holding ? 0 : values.amount;

    if (borderNow.delayMs === 0) {
      motion.amount = values.amount;
      motion.lastAt = now;
    } else {
      const dt = Math.min(
        MAX_FRAME_SECONDS,
        Math.max(0, (now - motion.lastAt) / 1000),
      );
      motion.lastAt = now;
      const step = 1 - Math.exp(-FOLLOW_SPEED * dt);
      motion.amount += (target - motion.amount) * step;
      if (Math.abs(target - motion.amount) < 0.001) {
        motion.amount = target;
      }
    }

    const offsets = rgbSplitOffsets(
      { amount: motion.amount, angle: values.angle },
      { splitPx: borderNow.strength, greenPx: borderNow.green },
    );
    writeOffset(borderRed.current, offsets.red);
    writeOffset(borderGreen.current, offsets.green);
    writeOffset(borderBlue.current, offsets.blue);
    writeFlood(floodRed.current, motion.amount);
    writeFlood(floodBlue.current, motion.amount);

    if (holding || Math.abs(motion.amount - target) >= 0.001) {
      motion.raf = requestAnimationFrame(paint);
    }
  }

  const handlers = usePointerEffect(rgbSplit, (values) => {
    latest.current = values;
    paint(performance.now());
  });

  useEffect(
    () => () => {
      const motion = borderMotion.current;
      if (motion.raf) {
        cancelAnimationFrame(motion.raf);
      }
    },
    [],
  );

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }
    const update = () => {
      const { width, height } = host.getBoundingClientRect();
      setBox((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const hasBorder = border != null;

  useLayoutEffect(() => {
    const host = hostRef.current;
    const ring = ringRef.current;
    if (!hasBorder || !host || !ring) {
      return;
    }
    const copy = () => copyBorder(host, ring);
    copy();
    const observer = new MutationObserver(copy);
    observer.observe(host, { attributes: true, attributeFilter: ["class"] });
    host.addEventListener("pointerenter", copy);
    host.addEventListener("pointerleave", copy);
    host.addEventListener("focusin", copy);
    host.addEventListener("focusout", copy);
    host.addEventListener("transitionend", copy);
    return () => {
      observer.disconnect();
      host.removeEventListener("pointerenter", copy);
      host.removeEventListener("pointerleave", copy);
      host.removeEventListener("focusin", copy);
      host.removeEventListener("focusout", copy);
      host.removeEventListener("transitionend", copy);
      host.style.borderColor = "";
    };
  }, [hasBorder]);

  return useRender({
    render,
    props: {
      ref: hostRef,
      className: "relative overflow-visible",
      onPointerEnter: (event: PointerEvent<Element>) => {
        const now = performance.now();
        borderMotion.current.enteredAt = now;
        borderMotion.current.lastAt = now;
        handlers.onPointerEnter(event);
      },
      onPointerMove: (event: PointerEvent<Element>) => {
        handlers.onPointerMove(event);
      },
      onPointerLeave: () => {
        borderMotion.current.enteredAt = null;
        handlers.onPointerLeave();
      },
      children: (
        <>
          {contentLayer ? (
            <ContentFilter
              id={contentId}
              padPx={Math.max(contentLayer.strength, contentLayer.green) + 1}
              box={box}
              offsetRefs={{
                red: contentRed,
                green: contentGreen,
                blue: contentBlue,
              }}
            />
          ) : null}
          {borderLayer ? (
            <BorderFilter
              id={borderId}
              padPx={Math.max(borderLayer.strength, borderLayer.green) + 1}
              box={box}
              offsetRefs={{
                red: borderRed,
                green: borderGreen,
                blue: borderBlue,
              }}
              floodRefs={{ red: floodRed, blue: floodBlue }}
            />
          ) : null}
          {borderLayer ? (
            <span
              ref={ringRef}
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[inherit] border-solid"
              style={{ filter: `url(#${borderId})` }}
            />
          ) : null}
          {content?.clip ? (
            <span className="absolute inset-0 overflow-hidden rounded-[inherit]">
              <span
                className="relative block size-full"
                style={{ filter: `url(#${contentId})` }}
              >
                {children}
              </span>
            </span>
          ) : (
            <span
              className={cn(
                "relative inline-flex size-full items-center justify-center gap-[inherit] rounded-[inherit]",
                borderLayer && "z-10",
              )}
              style={
                contentLayer ? { filter: `url(#${contentId})` } : undefined
              }
            >
              {children}
            </span>
          )}
        </>
      ),
    },
  });
}
