"use client";

import Image from "next/image";
import { type PointerEvent, useCallback, useEffect, useRef } from "react";
import {
  pointerPositionInElement,
  usePrefersReducedMotion,
} from "@/components/hover-lens";
import { cn } from "@/lib/utils";

const AVATAR_SIZE_PX = 152;
const SPLIT_DURATION_MS = 300;
const SPLIT_PX = 3;
const GREEN_PX = 1;
/** Ignore tiny center moves so the axis does not flip in place. */
const DIRECTION_DEADZONE = 0.08;
/** Higher = the split axis catches the pointer faster. */
const ANGLE_FOLLOW_SPEED = 10;
const MAX_FRAME_SECONDS = 0.05;
const SETTLED_ANGLE = 0.001;

/** Tailwind `ease-out`: fast start, settle at the end. */
function easeOut(t: number) {
  return 1 - (1 - t) ** 3;
}

function exponentialEase(speed: number, dt: number) {
  return 1 - Math.exp(-speed * dt);
}

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

function angleFromPointer(event: PointerEvent<HTMLElement>): number | null {
  const { x, y } = pointerPositionInElement(event);
  const dx = x - 0.5;
  const dy = y - 0.5;
  if (Math.hypot(dx, dy) < DIRECTION_DEADZONE) {
    return null;
  }
  return Math.atan2(dy, dx);
}

type ProfileAvatarProps = {
  className?: string;
};

export function ProfileAvatar({ className }: ProfileAvatarProps) {
  const redOffsetRef = useRef<SVGFEOffsetElement>(null);
  const greenOffsetRef = useRef<SVGFEOffsetElement>(null);
  const blueOffsetRef = useRef<SVGFEOffsetElement>(null);
  const amountRef = useRef(0);
  const amountFromRef = useRef(0);
  const amountTargetRef = useRef(0);
  const amountStartRef = useRef(0);
  const amountAnimatingRef = useRef(false);
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
    writeOffset(
      redOffsetRef.current,
      x * SPLIT_PX * amount,
      y * SPLIT_PX * amount,
    );
    writeOffset(
      blueOffsetRef.current,
      -x * SPLIT_PX * amount,
      -y * SPLIT_PX * amount,
    );
    writeOffset(
      greenOffsetRef.current,
      -y * GREEN_PX * amount,
      x * GREEN_PX * amount,
    );
  }, []);

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
      if (amountAnimatingRef.current) {
        const t = Math.min(
          1,
          (now - amountStartRef.current) / SPLIT_DURATION_MS,
        );
        amountRef.current =
          amountFromRef.current +
          (amountTargetRef.current - amountFromRef.current) * easeOut(t);
        if (t >= 1) {
          amountRef.current = amountTargetRef.current;
          amountAnimatingRef.current = false;
        }
      }

      const dt = Math.min(
        MAX_FRAME_SECONDS,
        (now - lastFrameRef.current) / 1000,
      );
      lastFrameRef.current = now;
      const angleDelta = shortestAngleDelta(
        angleRef.current,
        angleTargetRef.current,
      );
      angleRef.current += angleDelta * exponentialEase(ANGLE_FOLLOW_SPEED, dt);

      apply();

      const angleSettled =
        Math.abs(shortestAngleDelta(angleRef.current, angleTargetRef.current)) <
        SETTLED_ANGLE;
      if (!amountAnimatingRef.current && angleSettled) {
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
      amountFromRef.current = amountRef.current;
      amountTargetRef.current = target;
      amountStartRef.current = performance.now();
      amountAnimatingRef.current = true;
      startLoop();
    },
    [startLoop],
  );

  useEffect(() => stop, [stop]);

  function aimAtPointer(event: PointerEvent<HTMLElement>, snap: boolean) {
    const next = angleFromPointer(event);
    if (next == null) {
      return;
    }
    angleTargetRef.current = next;
    if (snap) {
      angleRef.current = next;
    }
  }

  function handlePointerEnter(event: PointerEvent<HTMLDivElement>) {
    if (prefersReducedMotion) {
      return;
    }
    aimAtPointer(event, true);
    playAmountTo(1);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (prefersReducedMotion) {
      return;
    }
    aimAtPointer(event, false);
    startLoop();
  }

  function handlePointerLeave() {
    if (prefersReducedMotion) {
      return;
    }
    playAmountTo(0);
  }

  return (
    <div
      className={cn(
        "relative size-38 overflow-hidden rounded-full border",
        className,
      )}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <svg aria-hidden className="absolute size-0">
        <filter
          id="avatar-rgb-split"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feOffset
            ref={redOffsetRef}
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
            ref={greenOffsetRef}
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
            ref={blueOffsetRef}
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
      <Image
        src="/avatar/profile.png"
        alt="Picture of Dante Sparrås"
        fill
        sizes={`${AVATAR_SIZE_PX}px`}
        priority
        className="filter-[url(#avatar-rgb-split)] object-cover"
      />
    </div>
  );
}
