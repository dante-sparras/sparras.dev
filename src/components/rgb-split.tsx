"use client";

import {
  type PointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useRef,
} from "react";
import {
  exponentialEase,
  FOLLOW_SPEED,
  MAX_FRAME_SECONDS,
  pointerPositionInElement,
  SETTLED_DISTANCE,
  usePrefersReducedMotion,
} from "@/components/hover-lens";

/** Ignore tiny center moves so the axis does not flip in place. */
const DIRECTION_DEADZONE = 0.08;

export type RgbSplitOffsetRefs = {
  red: RefObject<SVGFEOffsetElement | null>;
  green: RefObject<SVGFEOffsetElement | null>;
  blue: RefObject<SVGFEOffsetElement | null>;
};

type UseRgbSplitHoverOptions = {
  splitPx: number;
  greenPx: number;
};

/** Signed delta from `from` to `to` on the shortest arc, in (-π, π]. */
function shortestAngleDelta(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function writeOffset(node: SVGFEOffsetElement | null, x: number, y: number) {
  if (!node) {
    return;
  }
  node.dx.baseVal = x;
  node.dy.baseVal = y;
  node.setAttribute("dx", String(x));
  node.setAttribute("dy", String(y));
}

function angleFromPointer(event: PointerEvent<Element>): number | null {
  const { x, y } = pointerPositionInElement(event);
  const dx = x - 0.5;
  const dy = y - 0.5;
  if (Math.hypot(dx, dy) < DIRECTION_DEADZONE) {
    return null;
  }
  return Math.atan2(dy, dx);
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
  const amountRef = useRef(0);
  const amountTargetRef = useRef(0);
  const angleRef = useRef(0);
  const angleTargetRef = useRef(0);
  const lastFrameRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const apply = useCallback(() => {
    const amount = amountRef.current;
    const angle = angleRef.current;
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
  }, [greenPx, splitPx]);

  const stop = useCallback(() => {
    if (rafRef.current == null) {
      return;
    }
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current != null) {
      return;
    }

    lastFrameRef.current = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(
        MAX_FRAME_SECONDS,
        (now - lastFrameRef.current) / 1000,
      );
      lastFrameRef.current = now;
      const step = exponentialEase(FOLLOW_SPEED, dt);

      amountRef.current += (amountTargetRef.current - amountRef.current) * step;
      angleRef.current +=
        shortestAngleDelta(angleRef.current, angleTargetRef.current) * step;

      apply();

      const amountSettled =
        Math.abs(amountRef.current - amountTargetRef.current) <
        SETTLED_DISTANCE;
      const angleSettled =
        Math.abs(shortestAngleDelta(angleRef.current, angleTargetRef.current)) <
        SETTLED_DISTANCE;
      if (amountSettled && angleSettled) {
        amountRef.current = amountTargetRef.current;
        angleRef.current = angleTargetRef.current;
        apply();
        rafRef.current = null;
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [apply]);

  const playAmountTo = useCallback(
    (target: number) => {
      amountTargetRef.current = target;
      startLoop();
    },
    [startLoop],
  );

  useEffect(() => stop, [stop]);

  function aimAtPointer(event: PointerEvent<Element>, snap: boolean) {
    const next = angleFromPointer(event);
    if (next == null) {
      return;
    }
    angleTargetRef.current = next;
    if (snap) {
      angleRef.current = next;
    }
  }

  function onPointerEnter(event: PointerEvent<Element>) {
    if (prefersReducedMotion) {
      return;
    }
    aimAtPointer(event, true);
    playAmountTo(1);
  }

  function onPointerMove(event: PointerEvent<Element>) {
    if (prefersReducedMotion) {
      return;
    }
    aimAtPointer(event, false);
    startLoop();
  }

  function onPointerLeave() {
    if (prefersReducedMotion) {
      return;
    }
    playAmountTo(0);
  }

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
